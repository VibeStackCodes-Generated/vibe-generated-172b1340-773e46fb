/**
 * Client-side matching engine
 * Matches invoices to transactions using deterministic rules with confidence scoring
 */

import type {
  Invoice,
  Transaction,
  MatchCandidate,
  MatchingConfig,
} from '@/types/matching'
import { DEFAULT_MATCHING_CONFIG } from '@/types/matching'
import {
  levenshteinSimilarity,
  fuzzyScore,
  compareReferenceSets,
  extractReferences,
} from './string-distance'

/**
 * Normalize a date to start of day for comparison
 */
function normalizeDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/**
 * Calculate the difference in days between two dates
 */
function dateDifferenceDays(date1: Date | string, date2: Date | string): number {
  const d1 = normalizeDate(date1)
  const d2 = normalizeDate(date2)
  const diffMs = Math.abs(d1.getTime() - d2.getTime())
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Calculate amount matching score
 * Returns a score between 0 and 1 based on how close the amounts are
 */
function calculateAmountScore(
  invoiceAmount: number,
  transactionAmount: number,
  config: MatchingConfig
): { score: number; isMatch: boolean; difference: number } {
  const difference = Math.abs(invoiceAmount - transactionAmount)
  const percentageDifference = (difference / invoiceAmount) * 100

  // Check for exact match
  if (invoiceAmount === transactionAmount) {
    return { score: 1.0, isMatch: true, difference: 0 }
  }

  // If exact match is required, fail early
  if (config.exactAmountMatch) {
    return { score: 0.0, isMatch: false, difference }
  }

  // Calculate tolerance
  const tolerance = (config.amountTolerance * invoiceAmount) / 100

  // Check if within tolerance
  if (difference <= tolerance) {
    // Score decreases as difference increases within tolerance
    const score = 1 - percentageDifference / (config.amountTolerance * 100)
    return { score: Math.max(0, score), isMatch: true, difference }
  }

  // Outside tolerance - score based on how close
  const maxDifference = invoiceAmount * 0.5 // Scale against 50% difference
  const score = Math.max(0, 1 - percentageDifference / 50)

  return { score: Math.max(0, score * 0.5), isMatch: false, difference }
}

/**
 * Calculate date matching score
 * Returns a score based on how close the dates are within the window
 */
function calculateDateScore(
  invoiceDate: Date | string,
  transactionDate: Date | string,
  config: MatchingConfig
): { score: number; inWindow: boolean; difference: number } {
  const difference = dateDifferenceDays(invoiceDate, transactionDate)
  const inWindow = difference <= config.dateWindowDays

  if (difference === 0) {
    return { score: 1.0, inWindow: true, difference: 0 }
  }

  if (!inWindow) {
    // Score near zero for dates outside window, but not completely zero
    return { score: 0.1, inWindow: false, difference }
  }

  // Linear decay: score decreases as difference increases within window
  const score = 1 - difference / config.dateWindowDays

  return { score: Math.max(0, score), inWindow: true, difference }
}

/**
 * Calculate reference/customer matching score
 * Compares invoice customer/reference info with transaction description
 */
function calculateReferenceScore(
  invoice: Invoice,
  transaction: Transaction,
  config: MatchingConfig
): number {
  // Extract references from both sides
  const invoiceRefs = extractReferences(
    `${invoice.customerName} ${invoice.referenceId || ''} ${invoice.description || ''}`
  )
  const transactionRefs = extractReferences(transaction.description)

  if (invoiceRefs.length === 0 || transactionRefs.length === 0) {
    return 0.3 // Default moderate score if no references to compare
  }

  // Compare the two sets of references
  const similarity = compareReferenceSets(invoiceRefs, transactionRefs)

  // Also check direct similarity between customer name and transaction description
  const customerSimilarity = levenshteinSimilarity(
    invoice.customerName,
    transaction.description
  )

  // Take weighted average
  return Math.max(similarity, customerSimilarity * 0.8)
}

/**
 * Calculate overall confidence score for a match
 * Uses weighted combination of amount, date, and reference scores
 */
function calculateConfidenceScore(
  amountScore: number,
  dateScore: number,
  referenceScore: number,
  config: MatchingConfig
): number {
  // Normalize weights to sum to 1
  const totalWeight =
    config.amountWeight + config.dateWeight + config.referenceWeight
  const normalizedAmountWeight = config.amountWeight / totalWeight
  const normalizedDateWeight = config.dateWeight / totalWeight
  const normalizedRefWeight = config.referenceWeight / totalWeight

  const confidence =
    amountScore * normalizedAmountWeight +
    dateScore * normalizedDateWeight +
    referenceScore * normalizedRefWeight

  return Math.max(0, Math.min(1, confidence)) // Clamp to 0-1
}

/**
 * Find all candidate matches for a single invoice
 */
function findCandidatesForInvoice(
  invoice: Invoice,
  transactions: Transaction[],
  config: MatchingConfig
): MatchCandidate[] {
  const candidates: MatchCandidate[] = []

  for (const transaction of transactions) {
    // Calculate individual scores
    const amountResult = calculateAmountScore(
      invoice.amount,
      transaction.amount,
      config
    )
    const dateResult = calculateDateScore(
      invoice.date,
      transaction.date,
      config
    )
    const referenceScore = calculateReferenceScore(invoice, transaction, config)

    // Calculate overall confidence
    const confidenceScore = calculateConfidenceScore(
      amountResult.score,
      dateResult.score,
      referenceScore,
      config
    )

    // Only include if meets minimum threshold
    if (confidenceScore >= config.minConfidenceScore) {
      candidates.push({
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
      })
    }
  }

  // Sort by confidence score (highest first)
  return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore)
}

/**
 * Find all candidate matches between invoices and transactions
 * @param invoices - List of invoices to match
 * @param transactions - List of transactions to match against
 * @param config - Optional matching configuration (uses defaults if not provided)
 * @returns Array of match candidates, sorted by confidence score
 */
export function findMatches(
  invoices: Invoice[],
  transactions: Transaction[],
  config: Partial<MatchingConfig> = {}
): MatchCandidate[] {
  // Merge provided config with defaults
  const finalConfig: MatchingConfig = {
    ...DEFAULT_MATCHING_CONFIG,
    ...config,
  }

  const allCandidates: MatchCandidate[] = []

  // Find candidates for each invoice
  for (const invoice of invoices) {
    const candidates = findCandidatesForInvoice(
      invoice,
      transactions,
      finalConfig
    )
    allCandidates.push(...candidates)
  }

  // Sort by confidence score (highest first)
  return allCandidates.sort((a, b) => b.confidenceScore - a.confidenceScore)
}

/**
 * Find top N candidates for each invoice
 * Useful for UI that shows "top 3 matches" for example
 */
export function findTopMatches(
  invoices: Invoice[],
  transactions: Transaction[],
  topN: number = 3,
  config: Partial<MatchingConfig> = {}
): Map<string, MatchCandidate[]> {
  const finalConfig: MatchingConfig = {
    ...DEFAULT_MATCHING_CONFIG,
    ...config,
  }

  const matchesByInvoice = new Map<string, MatchCandidate[]>()

  // Find top candidates for each invoice
  for (const invoice of invoices) {
    const candidates = findCandidatesForInvoice(
      invoice,
      transactions,
      finalConfig
    )
    matchesByInvoice.set(invoice.id, candidates.slice(0, topN))
  }

  return matchesByInvoice
}

/**
 * Get statistics about matching results
 */
export interface MatchingStats {
  totalInvoices: number
  totalTransactions: number
  totalCandidates: number
  averageConfidence: number
  confidenceDistribution: {
    high: number // >= 0.8
    medium: number // 0.5 - 0.8
    low: number // < 0.5
  }
}

export function getMatchingStats(
  candidates: MatchCandidate[]
): MatchingStats {
  const confidenceDistribution = {
    high: 0,
    medium: 0,
    low: 0,
  }

  let totalConfidence = 0

  for (const candidate of candidates) {
    totalConfidence += candidate.confidenceScore

    if (candidate.confidenceScore >= 0.8) {
      confidenceDistribution.high++
    } else if (candidate.confidenceScore >= 0.5) {
      confidenceDistribution.medium++
    } else {
      confidenceDistribution.low++
    }
  }

  return {
    totalInvoices: new Set(candidates.map((c) => c.invoiceId)).size,
    totalTransactions: new Set(candidates.map((c) => c.transactionId)).size,
    totalCandidates: candidates.length,
    averageConfidence:
      candidates.length > 0 ? totalConfidence / candidates.length : 0,
    confidenceDistribution,
  }
}
