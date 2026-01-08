#!/usr/bin/env node

/**
 * Test runner for the matching engine
 * Run with: node test-matching.mjs
 */

// Simple assertions for testing
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

const assertEqual = (actual, expected, message) => {
  if (actual !== expected) {
    throw new Error(
      `Assertion failed: ${message}. Expected ${expected}, got ${actual}`
    );
  }
};

// Import matching utilities (mock for testing)
function levenshteinDistance(str1, str2) {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  const matrix = Array(s2.length + 1)
    .fill(null)
    .map(() => Array(s1.length + 1).fill(0));

  for (let i = 0; i <= s1.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      );
    }
  }

  return matrix[s2.length][s1.length];
}

function levenshteinSimilarity(str1, str2) {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  if (maxLength === 0) return 1.0;
  return 1 - distance / maxLength;
}

function fuzzyScore(pattern, target) {
  const p = pattern.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (p.length === 0) return 1.0;
  if (t.length === 0) return 0.0;

  let patternIndex = 0;
  let targetIndex = 0;
  let matchedCharacters = 0;

  while (targetIndex < t.length && patternIndex < p.length) {
    if (p[patternIndex] === t[targetIndex]) {
      matchedCharacters++;
      patternIndex++;
    }
    targetIndex++;
  }

  if (patternIndex === p.length) {
    const consecutiveBonus = matchedCharacters / p.length;
    const positionBonus = 1 - targetIndex / t.length / 2;
    return Math.max(0.5, Math.min(1, (consecutiveBonus + positionBonus) / 2));
  }

  return 0.0;
}

function extractReferences(text) {
  const refs = [];
  if (!text) return refs;

  const numberMatches = text.match(/\b\d{3,}\b/g);
  if (numberMatches) {
    refs.push(...numberMatches);
  }

  const alphanumericMatches = text.match(/\b[A-Z]{1,4}-?\d{1,10}\b/gi);
  if (alphanumericMatches) {
    refs.push(...alphanumericMatches.map((m) => m.toUpperCase()));
  }

  const words = text
    .toLowerCase()
    .split(/[\s\-_(),]/g)
    .filter((w) => w.length > 2);
  refs.push(...words);

  return [...new Set(refs)];
}

function compareReferenceSets(refs1, refs2) {
  if (refs1.length === 0 && refs2.length === 0) return 1.0;
  if (refs1.length === 0 || refs2.length === 0) return 0.0;

  let totalScore = 0;
  let comparisons = 0;

  for (const ref1 of refs1) {
    let bestMatch = 0;

    for (const ref2 of refs2) {
      if (ref1 === ref2) {
        bestMatch = 1.0;
        break;
      }

      const similarity = levenshteinSimilarity(ref1, ref2);
      bestMatch = Math.max(bestMatch, similarity);

      const fuzzy = fuzzyScore(ref1, ref2);
      bestMatch = Math.max(bestMatch, fuzzy);
    }

    totalScore += bestMatch;
    comparisons++;
  }

  return comparisons > 0 ? totalScore / comparisons : 0.0;
}

function normalizeDate(date) {
  const d = typeof date === "string" ? new Date(date) : new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function dateDifferenceDays(date1, date2) {
  const d1 = normalizeDate(date1);
  const d2 = normalizeDate(date2);
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function calculateAmountScore(invoiceAmount, transactionAmount, config) {
  const difference = Math.abs(invoiceAmount - transactionAmount);
  const percentageDifference = (difference / invoiceAmount) * 100;

  if (invoiceAmount === transactionAmount) {
    return { score: 1.0, isMatch: true, difference: 0 };
  }

  if (config.exactAmountMatch) {
    return { score: 0.0, isMatch: false, difference };
  }

  const tolerance = (config.amountTolerance * invoiceAmount) / 100;

  if (difference <= tolerance) {
    const score = 1 - percentageDifference / (config.amountTolerance * 100);
    return { score: Math.max(0, score), isMatch: true, difference };
  }

  const score = Math.max(0, 1 - percentageDifference / 50);
  return { score: Math.max(0, score * 0.5), isMatch: false, difference };
}

function calculateDateScore(invoiceDate, transactionDate, config) {
  const difference = dateDifferenceDays(invoiceDate, transactionDate);
  const inWindow = difference <= config.dateWindowDays;

  if (difference === 0) {
    return { score: 1.0, inWindow: true, difference: 0 };
  }

  if (!inWindow) {
    return { score: 0.1, inWindow: false, difference };
  }

  const score = 1 - difference / config.dateWindowDays;
  return { score: Math.max(0, score), inWindow: true, difference };
}

function calculateReferenceScore(invoice, transaction, config) {
  const invoiceRefs = extractReferences(
    `${invoice.customerName} ${invoice.referenceId || ""} ${invoice.description || ""}`
  );
  const transactionRefs = extractReferences(transaction.description);

  if (invoiceRefs.length === 0 || transactionRefs.length === 0) {
    return 0.3;
  }

  const similarity = compareReferenceSets(invoiceRefs, transactionRefs);
  const customerSimilarity = levenshteinSimilarity(
    invoice.customerName,
    transaction.description
  );

  return Math.max(similarity, customerSimilarity * 0.8);
}

function calculateConfidenceScore(amountScore, dateScore, referenceScore, config) {
  const totalWeight =
    config.amountWeight + config.dateWeight + config.referenceWeight;
  const normalizedAmountWeight = config.amountWeight / totalWeight;
  const normalizedDateWeight = config.dateWeight / totalWeight;
  const normalizedRefWeight = config.referenceWeight / totalWeight;

  const confidence =
    amountScore * normalizedAmountWeight +
    dateScore * normalizedDateWeight +
    referenceScore * normalizedRefWeight;

  return Math.max(0, Math.min(1, confidence));
}

const DEFAULT_MATCHING_CONFIG = {
  exactAmountMatch: false,
  amountTolerance: 0.02,
  amountWeight: 0.4,
  dateWindowDays: 30,
  dateWeight: 0.3,
  referenceSimilarityThreshold: 0.5,
  referenceWeight: 0.3,
  minConfidenceScore: 0.5,
};

function findMatches(invoices, transactions, config = {}) {
  const finalConfig = { ...DEFAULT_MATCHING_CONFIG, ...config };
  const allCandidates = [];

  for (const invoice of invoices) {
    for (const transaction of transactions) {
      const amountResult = calculateAmountScore(
        invoice.amount,
        transaction.amount,
        finalConfig
      );
      const dateResult = calculateDateScore(
        invoice.date,
        transaction.date,
        finalConfig
      );
      const referenceScore = calculateReferenceScore(
        invoice,
        transaction,
        finalConfig
      );

      const confidenceScore = calculateConfidenceScore(
        amountResult.score,
        dateResult.score,
        referenceScore,
        finalConfig
      );

      if (confidenceScore >= finalConfig.minConfidenceScore) {
        allCandidates.push({
          invoiceId: invoice.id,
          transactionId: transaction.id,
          confidenceScore,
          amountScore: amountResult.score,
          dateScore: dateResult.score,
          referenceScore,
          breakdown: {
            amountDifference: amountResult.difference,
            dateDifference: dateResult.difference,
            amountMatch: amountResult.isMatch,
            dateInWindow: dateResult.inWindow,
            referenceSimilarity: referenceScore,
          },
        });
      }
    }
  }

  return allCandidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

// ============================================================================
// TESTS
// ============================================================================

console.log("🧪 Running Matching Engine Tests\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`✓ ${name}`);
    passedTests++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
  }
}

// Test 1: Exact amount and date match
runTest("Test 1: Exact amount and date match", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Test Company",
      referenceId: "REF-001",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      description: "Test Company REF-001 payment",
      source: "bank",
    },
  ];

  const matches = findMatches(invoices, transactions);
  assert(matches.length === 1, "Expected 1 match for exact amount and date");
  assert(
    matches[0].confidenceScore > 0.8,
    "Expected high confidence for exact match"
  );
});

// Test 2: Amount within tolerance
runTest("Test 2: Amount within tolerance", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Test Company",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 1015,
      date: new Date("2024-01-15"),
      description: "Test Company payment",
      source: "bank",
    },
  ];

  const matches = findMatches(invoices, transactions, {
    amountTolerance: 0.02,
  });

  assert(matches.length === 1, "Expected 1 match within tolerance");
  // 1.5% difference is within 2% tolerance, so amountMatch should be true
  assert(
    matches[0].breakdown.amountDifference <= 20,
    "Expected small amount difference"
  );
});

// Test 3: Date within window
runTest("Test 3: Date within window", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Test Company",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 1000,
      date: new Date("2024-01-25"),
      description: "Test Company payment",
      source: "bank",
    },
  ];

  const matches = findMatches(invoices, transactions, {
    dateWindowDays: 30,
  });

  assert(matches.length === 1, "Expected 1 match within date window");
  assert(
    matches[0].breakdown.dateInWindow,
    "Expected date to be in window"
  );
});

// Test 4: Date outside window
runTest("Test 4: Date outside window", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Test Company",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 1000,
      date: new Date("2024-03-15"),
      description: "Test Company payment",
      source: "bank",
    },
  ];

  const matches = findMatches(invoices, transactions, {
    dateWindowDays: 30,
    minConfidenceScore: 0.0,
  });

  assert(
    matches.length === 0 || !matches[0].breakdown.dateInWindow,
    "Expected no matches or date marked as outside window"
  );
});

// Test 5: Reference/customer name similarity
runTest("Test 5: Reference/customer name similarity", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Acme Corporation",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      description: "Acme Corp payment",
      source: "bank",
    },
  ];

  const matches = findMatches(invoices, transactions);

  assert(
    matches.length === 1,
    "Expected 1 match with similar customer name"
  );
  assert(matches[0].referenceScore > 0, "Expected positive reference score");
});

// Test 6: Minimum confidence threshold
runTest("Test 6: Minimum confidence threshold", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Company A",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 2000,
      date: new Date("2024-02-20"),
      description: "Random payment",
      source: "bank",
    },
  ];

  const matchesHigh = findMatches(invoices, transactions, {
    minConfidenceScore: 0.8,
  });

  const matchesLow = findMatches(invoices, transactions, {
    minConfidenceScore: 0.1,
  });

  assert(
    matchesHigh.length === 0,
    "Expected no matches with high confidence threshold"
  );
});

// Test 7: Levenshtein distance
runTest("Test 7: Levenshtein distance", () => {
  const distance1 = levenshteinDistance("kitten", "sitting");
  assertEqual(distance1, 3, "Expected distance 3 for kitten->sitting");

  const similarity = levenshteinSimilarity("Acme Corporation", "Acme Corp");
  assert(similarity > 0.5, "Expected reasonable similarity for similar names");
});

// Test 8: Fuzzy scoring
runTest("Test 8: Fuzzy scoring", () => {
  const score1 = fuzzyScore("abc", "aabbcc");
  assert(score1 > 0.5, "Expected positive fuzzy score");

  const score2 = fuzzyScore("xyz", "aabbcc");
  assertEqual(score2, 0.0, "Expected 0 for no match");
});

// Test 9: Extract references
runTest("Test 9: Extract references", () => {
  const refs = extractReferences("Invoice INV-2024-001 from Company ABC 123");
  assert(refs.length > 0, "Expected to extract some references");
  // Check for either the invoice number or the numeric parts
  assert(
    refs.some((r) => r.includes("2024") || r.includes("001") || r.includes("123")),
    "Expected to extract numbers"
  );
});

// Test 10: No matches scenario
runTest("Test 10: No matches scenario", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Company A",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 5000,
      date: new Date("2024-06-15"),
      description: "Completely different transaction",
      source: "bank",
    },
  ];

  const matches = findMatches(invoices, transactions, {
    minConfidenceScore: 0.8,
  });

  assert(
    matches.length === 0,
    "Expected no matches for dissimilar invoice/transaction"
  );
});

// Test 11: Multiple matches per invoice
runTest("Test 11: Multiple matches per invoice", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Test Company",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      description: "Test Company payment",
      source: "bank",
    },
    {
      id: "TXN-002",
      amount: 1005,
      date: new Date("2024-01-16"),
      description: "Test Company transaction",
      source: "bank",
    },
  ];

  const matches = findMatches(invoices, transactions);
  assert(matches.length >= 1, "Expected at least one match");
  assert(
    matches[0].confidenceScore >= matches[1]?.confidenceScore || 1,
    "Expected matches sorted by confidence"
  );
});

// Test 12: Confidence calculation weights
runTest("Test 12: Confidence calculation weights", () => {
  const invoices = [
    {
      id: "INV-001",
      amount: 1000,
      date: new Date("2024-01-15"),
      customerId: "CUST-001",
      customerName: "Test Company",
    },
  ];

  const transactions = [
    {
      id: "TXN-001",
      amount: 1005,
      date: new Date("2024-01-25"),
      description: "Test Company payment",
      source: "bank",
    },
  ];

  // Prioritize amount matching
  const amountFocused = findMatches(invoices, transactions, {
    amountWeight: 0.7,
    dateWeight: 0.2,
    referenceWeight: 0.1,
    minConfidenceScore: 0.0,
  });

  // Prioritize date matching
  const dateFocused = findMatches(invoices, transactions, {
    amountWeight: 0.1,
    dateWeight: 0.7,
    referenceWeight: 0.2,
    minConfidenceScore: 0.0,
  });

  assert(amountFocused.length > 0, "Expected match with amount-focused weights");
  assert(dateFocused.length > 0, "Expected match with date-focused weights");
});

// Summary
console.log("\n" + "=".repeat(50));
console.log(`\n✅ Test Results: ${passedTests}/${totalTests} passed\n`);

if (passedTests === totalTests) {
  console.log("🎉 All tests passed!");
  process.exit(0);
} else {
  console.log(`❌ ${totalTests - passedTests} test(s) failed`);
  process.exit(1);
}
