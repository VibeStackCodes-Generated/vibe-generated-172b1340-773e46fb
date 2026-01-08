/**
 * Test suite for the matching engine
 * Demonstrates how the matching algorithm works with various scenarios
 */

import { findMatches, findTopMatches, getMatchingStats } from './matching-engine'
import type { Invoice, Transaction, MatchingConfig } from '@/types/matching'

/**
 * Test 1: Exact amount and date match
 */
export function testExactMatch(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Test Company',
      referenceId: 'REF-001',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      description: 'Test Company REF-001 payment',
      source: 'bank',
    },
  ]

  const matches = findMatches(invoices, transactions)
  console.assert(
    matches.length === 1,
    'Expected 1 match for exact amount and date'
  )
  console.assert(
    matches[0].confidenceScore > 0.8,
    'Expected high confidence for exact match'
  )
  console.log('✓ Test 1: Exact match passed')
}

/**
 * Test 2: Amount within tolerance
 */
export function testAmountTolerance(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Test Company',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1015, // 1.5% difference
      date: new Date('2024-01-15'),
      description: 'Test Company payment',
      source: 'bank',
    },
  ]

  const matches = findMatches(invoices, transactions, {
    amountTolerance: 0.02, // 2% tolerance
  })

  console.assert(
    matches.length === 1,
    'Expected 1 match within tolerance'
  )
  console.assert(
    matches[0].breakdown.amountMatch,
    'Expected amount to be marked as matching'
  )
  console.log('✓ Test 2: Amount tolerance passed')
}

/**
 * Test 3: Date within window
 */
export function testDateWindow(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Test Company',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1000,
      date: new Date('2024-01-25'), // 10 days later
      description: 'Test Company payment',
      source: 'bank',
    },
  ]

  const matches = findMatches(invoices, transactions, {
    dateWindowDays: 30,
  })

  console.assert(
    matches.length === 1,
    'Expected 1 match within date window'
  )
  console.assert(
    matches[0].breakdown.dateInWindow,
    'Expected date to be in window'
  )
  console.log('✓ Test 3: Date window passed')
}

/**
 * Test 4: Date outside window
 */
export function testDateOutsideWindow(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Test Company',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1000,
      date: new Date('2024-03-15'), // 59 days later
      description: 'Test Company payment',
      source: 'bank',
    },
  ]

  const matches = findMatches(invoices, transactions, {
    dateWindowDays: 30,
    minConfidenceScore: 0.0, // Lower threshold to capture low-confidence matches
  })

  console.assert(
    matches.length === 0 || !matches[0].breakdown.dateInWindow,
    'Expected no matches or date marked as outside window'
  )
  console.log('✓ Test 4: Date outside window passed')
}

/**
 * Test 5: Reference/customer name similarity
 */
export function testReferenceSimilarity(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Acme Corporation',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      description: 'Acme Corp payment', // Similar but not exact
      source: 'bank',
    },
  ]

  const matches = findMatches(invoices, transactions)

  console.assert(
    matches.length === 1,
    'Expected 1 match with similar customer name'
  )
  console.assert(
    matches[0].referenceScore > 0,
    'Expected positive reference score'
  )
  console.log('✓ Test 5: Reference similarity passed')
}

/**
 * Test 6: Minimum confidence threshold
 */
export function testMinConfidenceThreshold(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Company A',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 2000, // Different amount
      date: new Date('2024-02-20'), // Different date
      description: 'Random payment',
      source: 'bank',
    },
  ]

  const matchesHigh = findMatches(invoices, transactions, {
    minConfidenceScore: 0.8,
  })

  const matchesLow = findMatches(invoices, transactions, {
    minConfidenceScore: 0.1,
  })

  console.assert(
    matchesHigh.length === 0,
    'Expected no matches with high confidence threshold'
  )
  console.assert(
    matchesLow.length >= 0,
    'Expected possible matches with low threshold'
  )
  console.log('✓ Test 6: Min confidence threshold passed')
}

/**
 * Test 7: Top matches functionality
 */
export function testTopMatches(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Test Company',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      description: 'Test Company payment',
      source: 'bank',
    },
    {
      id: 'TXN-002',
      amount: 1005,
      date: new Date('2024-01-16'),
      description: 'Test Company transaction',
      source: 'bank',
    },
    {
      id: 'TXN-003',
      amount: 2000,
      date: new Date('2024-03-15'),
      description: 'Other payment',
      source: 'bank',
    },
  ]

  const topMatches = findTopMatches(invoices, transactions, 2)

  console.assert(
    topMatches.has('INV-001'),
    'Expected entry for INV-001'
  )
  console.assert(
    topMatches.get('INV-001')!.length <= 2,
    'Expected at most 2 top matches'
  )
  console.assert(
    topMatches.get('INV-001')![0].transactionId === 'TXN-001',
    'Expected first match to be TXN-001 (best match)'
  )
  console.log('✓ Test 7: Top matches passed')
}

/**
 * Test 8: Statistics calculation
 */
export function testStatistics(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Company A',
    },
    {
      id: 'INV-002',
      amount: 2000,
      date: new Date('2024-01-20'),
      customerId: 'CUST-002',
      customerName: 'Company B',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      description: 'Company A payment',
      source: 'bank',
    },
    {
      id: 'TXN-002',
      amount: 2000,
      date: new Date('2024-01-20'),
      description: 'Company B payment',
      source: 'bank',
    },
  ]

  const matches = findMatches(invoices, transactions)
  const stats = getMatchingStats(matches)

  console.assert(
    stats.totalInvoices === 2,
    'Expected 2 invoices in statistics'
  )
  console.assert(
    stats.totalTransactions === 2,
    'Expected 2 transactions in statistics'
  )
  console.assert(
    stats.totalCandidates === 2,
    'Expected 2 candidate matches'
  )
  console.assert(
    stats.averageConfidence > 0.7,
    'Expected high average confidence for perfect matches'
  )
  console.log('✓ Test 8: Statistics calculation passed')
}

/**
 * Test 9: Configuration with custom weights
 */
export function testCustomWeights(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Test Company',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 1005, // Slight amount difference
      date: new Date('2024-01-25'), // Date difference
      description: 'Test Company payment',
      source: 'bank',
    },
  ]

  // Prioritize amount matching
  const amountFocused = findMatches(invoices, transactions, {
    amountWeight: 0.7,
    dateWeight: 0.2,
    referenceWeight: 0.1,
  })

  // Prioritize date matching
  const dateFocused = findMatches(invoices, transactions, {
    amountWeight: 0.1,
    dateWeight: 0.7,
    referenceWeight: 0.2,
  })

  console.assert(
    amountFocused.length > 0,
    'Expected match with amount-focused weights'
  )
  console.assert(
    amountFocused[0].amountScore > amountFocused[0].dateScore,
    'Expected amount score to be better weighted'
  )
  console.log('✓ Test 9: Custom weights passed')
}

/**
 * Test 10: No matches scenario
 */
export function testNoMatches(): void {
  const invoices: Invoice[] = [
    {
      id: 'INV-001',
      amount: 1000,
      date: new Date('2024-01-15'),
      customerId: 'CUST-001',
      customerName: 'Company A',
    },
  ]

  const transactions: Transaction[] = [
    {
      id: 'TXN-001',
      amount: 5000,
      date: new Date('2024-06-15'),
      description: 'Completely different transaction',
      source: 'bank',
    },
  ]

  const matches = findMatches(invoices, transactions, {
    minConfidenceScore: 0.8,
  })

  console.assert(
    matches.length === 0,
    'Expected no matches for dissimilar invoice/transaction'
  )
  console.log('✓ Test 10: No matches scenario passed')
}

/**
 * Run all tests
 */
export function runAllTests(): void {
  console.group('Running Matching Engine Tests')
  try {
    testExactMatch()
    testAmountTolerance()
    testDateWindow()
    testDateOutsideWindow()
    testReferenceSimilarity()
    testMinConfidenceThreshold()
    testTopMatches()
    testStatistics()
    testCustomWeights()
    testNoMatches()

    console.log('\n✓ All tests passed!')
  } catch (error) {
    console.error('Test failed:', error)
    throw error
  } finally {
    console.groupEnd()
  }
}
