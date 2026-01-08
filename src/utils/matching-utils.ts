/**
 * Utility functions for matching engine
 * Helper functions for common matching scenarios and edge cases
 */

import type { MatchCandidate, Invoice, Transaction } from '@/types/matching'

/**
 * Filter matches by confidence level
 */
export function filterByConfidence(
  candidates: MatchCandidate[],
  minConfidence: number,
  maxConfidence?: number
): MatchCandidate[] {
  return candidates.filter((c) => {
    const meetsMin = c.confidenceScore >= minConfidence
    const meetsMax = maxConfidence ? c.confidenceScore <= maxConfidence : true
    return meetsMin && meetsMax
  })
}

/**
 * Group matches by invoice
 */
export function groupByInvoice(
  candidates: MatchCandidate[]
): Map<string, MatchCandidate[]> {
  const grouped = new Map<string, MatchCandidate[]>()

  for (const candidate of candidates) {
    if (!grouped.has(candidate.invoiceId)) {
      grouped.set(candidate.invoiceId, [])
    }
    grouped.get(candidate.invoiceId)!.push(candidate)
  }

  // Sort matches within each invoice by confidence
  for (const matches of grouped.values()) {
    matches.sort((a, b) => b.confidenceScore - a.confidenceScore)
  }

  return grouped
}

/**
 * Group matches by transaction
 */
export function groupByTransaction(
  candidates: MatchCandidate[]
): Map<string, MatchCandidate[]> {
  const grouped = new Map<string, MatchCandidate[]>()

  for (const candidate of candidates) {
    if (!grouped.has(candidate.transactionId)) {
      grouped.set(candidate.transactionId, [])
    }
    grouped.get(candidate.transactionId)!.push(candidate)
  }

  // Sort matches within each transaction by confidence
  for (const matches of grouped.values()) {
    matches.sort((a, b) => b.confidenceScore - a.confidenceScore)
  }

  return grouped
}

/**
 * Find one-to-one matches (invoice to exactly one transaction, vice versa)
 * Useful for automatic reconciliation
 */
export function findOneToOneMatches(
  candidates: MatchCandidate[]
): MatchCandidate[] {
  const byInvoice = groupByInvoice(candidates)
  const byTransaction = groupByTransaction(candidates)

  return candidates.filter((c) => {
    const invoiceMatches = byInvoice.get(c.invoiceId)!.length === 1
    const transactionMatches = byTransaction.get(c.transactionId)!.length === 1
    return invoiceMatches && transactionMatches
  })
}

/**
 * Find ambiguous matches (one invoice matching multiple transactions or vice versa)
 * Useful for manual review UI
 */
export function findAmbiguousMatches(
  candidates: MatchCandidate[]
): MatchCandidate[] {
  const byInvoice = groupByInvoice(candidates)
  const byTransaction = groupByTransaction(candidates)

  return candidates.filter((c) => {
    const invoiceMatches = byInvoice.get(c.invoiceId)!.length > 1
    const transactionMatches = byTransaction.get(c.transactionId)!.length > 1
    return invoiceMatches || transactionMatches
  })
}

/**
 * Calculate matching accuracy metrics
 * Assumes we have ground truth matches for evaluation
 */
export interface MatchingMetrics {
  precision: number // Of proposed matches, how many are correct
  recall: number // Of actual matches, how many we found
  f1Score: number // Harmonic mean of precision and recall
  truePositives: number
  falsePositives: number
  falseNegatives: number
}

export function calculateMetrics(
  proposedMatches: MatchCandidate[],
  trueMatches: Set<string> // Format: "invoiceId-transactionId"
): MatchingMetrics {
  const proposed = new Set(
    proposedMatches.map((c) => `${c.invoiceId}-${c.transactionId}`)
  )

  let truePositives = 0
  let falsePositives = 0
  let falseNegatives = 0

  // Count true positives and false positives
  for (const match of proposed) {
    if (trueMatches.has(match)) {
      truePositives++
    } else {
      falsePositives++
    }
  }

  // Count false negatives
  for (const match of trueMatches) {
    if (!proposed.has(match)) {
      falseNegatives++
    }
  }

  const precision =
    truePositives + falsePositives === 0
      ? 0
      : truePositives / (truePositives + falsePositives)

  const recall =
    truePositives + falseNegatives === 0
      ? 0
      : truePositives / (truePositives + falseNegatives)

  const f1Score =
    precision + recall === 0
      ? 0
      : (2 * (precision * recall)) / (precision + recall)

  return {
    precision,
    recall,
    f1Score,
    truePositives,
    falsePositives,
    falseNegatives,
  }
}

/**
 * Analyze which scoring factors are most influential in matches
 */
export interface ScoringAnalysis {
  amountScoreInfluence: number
  dateScoreInfluence: number
  referenceScoreInfluence: number
  amountScoresDistribution: { min: number; max: number; avg: number }
  dateScoresDistribution: { min: number; max: number; avg: number }
  referenceScoresDistribution: { min: number; max: number; avg: number }
}

export function analyzeScoringFactors(
  candidates: MatchCandidate[]
): ScoringAnalysis {
  if (candidates.length === 0) {
    return {
      amountScoreInfluence: 0,
      dateScoreInfluence: 0,
      referenceScoreInfluence: 0,
      amountScoresDistribution: { min: 0, max: 0, avg: 0 },
      dateScoresDistribution: { min: 0, max: 0, avg: 0 },
      referenceScoresDistribution: { min: 0, max: 0, avg: 0 },
    }
  }

  let amountSum = 0
  let dateSum = 0
  let referenceSum = 0
  let amountMin = Infinity
  let amountMax = -Infinity
  let dateMin = Infinity
  let dateMax = -Infinity
  let refMin = Infinity
  let refMax = -Infinity

  for (const c of candidates) {
    amountSum += c.amountScore
    dateSum += c.dateScore
    referenceSum += c.referenceScore

    amountMin = Math.min(amountMin, c.amountScore)
    amountMax = Math.max(amountMax, c.amountScore)
    dateMin = Math.min(dateMin, c.dateScore)
    dateMax = Math.max(dateMax, c.dateScore)
    refMin = Math.min(refMin, c.referenceScore)
    refMax = Math.max(refMax, c.referenceScore)
  }

  const totalScoreSum = amountSum + dateSum + referenceSum

  return {
    amountScoreInfluence:
      totalScoreSum === 0 ? 0 : amountSum / totalScoreSum,
    dateScoreInfluence: totalScoreSum === 0 ? 0 : dateSum / totalScoreSum,
    referenceScoreInfluence:
      totalScoreSum === 0 ? 0 : referenceSum / totalScoreSum,
    amountScoresDistribution: {
      min: amountMin,
      max: amountMax,
      avg: amountSum / candidates.length,
    },
    dateScoresDistribution: {
      min: dateMin,
      max: dateMax,
      avg: dateSum / candidates.length,
    },
    referenceScoresDistribution: {
      min: refMin,
      max: refMax,
      avg: referenceSum / candidates.length,
    },
  }
}

/**
 * Suggest configuration adjustments based on matching results
 */
export interface ConfigurationSuggestion {
  factor: 'amount' | 'date' | 'reference'
  issue: string
  suggestion: string
  recommendedChange: string
}

export function suggestConfigurationAdjustments(
  candidates: MatchCandidate[],
  unmatchedInvoices: number,
  unmatchedTransactions: number
): ConfigurationSuggestion[] {
  const suggestions: ConfigurationSuggestion[] = []

  if (candidates.length === 0) {
    suggestions.push({
      factor: 'amount',
      issue: 'No matches found at all',
      suggestion: 'Try increasing amount tolerance or date window',
      recommendedChange: 'Increase amountTolerance to 0.05-0.10',
    })
    return suggestions
  }

  const analysis = analyzeScoringFactors(candidates)

  // Check if amount matching is too strict
  if (analysis.amountScoresDistribution.avg < 0.3) {
    suggestions.push({
      factor: 'amount',
      issue: 'Low average amount scores',
      suggestion: 'Consider increasing amount tolerance',
      recommendedChange: 'Increase amountTolerance by 1-2%',
    })
  }

  // Check if date matching is too strict
  if (analysis.dateScoresDistribution.avg < 0.3) {
    suggestions.push({
      factor: 'date',
      issue: 'Low average date scores',
      suggestion: 'Consider increasing date window',
      recommendedChange: 'Increase dateWindowDays by 10-20 days',
    })
  }

  // Check if reference matching is helping
  if (analysis.referenceScoreInfluence < 0.1) {
    suggestions.push({
      factor: 'reference',
      issue: 'Reference matching has minimal influence',
      suggestion: 'Consider increasing reference weight for better clarity',
      recommendedChange: 'Increase referenceWeight from 0.3 to 0.4+',
    })
  }

  // Check unmatched invoices
  if (unmatchedInvoices > 0) {
    suggestions.push({
      factor: 'amount',
      issue: `${unmatchedInvoices} invoices have no matches`,
      suggestion: 'Relax matching thresholds to find more candidates',
      recommendedChange: 'Lower minConfidenceScore from 0.5 to 0.3-0.4',
    })
  }

  return suggestions
}

/**
 * Export match results for reconciliation/accounting systems
 */
export interface ExportedMatch {
  invoiceId: string
  transactionId: string
  confidence: number
  reconciliationStatus: 'auto' | 'manual' | 'review'
  notes: string
}

export function exportMatches(
  candidates: MatchCandidate[],
  autoApproveThreshold: number = 0.9
): ExportedMatch[] {
  return candidates.map((c) => ({
    invoiceId: c.invoiceId,
    transactionId: c.transactionId,
    confidence: c.confidenceScore,
    reconciliationStatus:
      c.confidenceScore >= autoApproveThreshold
        ? 'auto'
        : c.confidenceScore >= 0.7
          ? 'manual'
          : 'review',
    notes: [
      c.breakdown.amountMatch ? 'Amount match' : `Amount diff: $${c.breakdown.amountDifference.toFixed(2)}`,
      c.breakdown.dateInWindow ? 'Date in window' : `Date diff: ${c.breakdown.dateDifference}d`,
      `Reference similarity: ${(c.breakdown.referenceSimilarity * 100).toFixed(0)}%`,
    ].join(', '),
  }))
}
