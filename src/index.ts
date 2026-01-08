/**
 * ClearCollect - Client-Side Matching Engine
 *
 * A deterministic matching utility for reconciling invoices with bank/payment processor transactions.
 * Provides configurable rules-based matching with confidence scoring.
 *
 * ## Features
 *
 * - **Amount Matching**: Exact match or tolerance-based (configurable %)
 * - **Date Window Matching**: Configurable date window (before/after invoice date)
 * - **Reference/Customer Matching**: Fuzzy string matching using Levenshtein distance
 * - **Confidence Scoring**: Weighted combination of all matching factors (0-1 scale)
 * - **Batch Matching**: Match multiple invoices against multiple transactions efficiently
 * - **Configurable Rules**: Customize weights, tolerances, and thresholds
 *
 * ## Quick Start
 *
 * ```typescript
 * import { findMatches } from '@/utils/matching-engine'
 * import type { Invoice, Transaction } from '@/types/matching'
 *
 * const invoices: Invoice[] = [...]
 * const transactions: Transaction[] = [...]
 *
 * // Find matches with default configuration
 * const matches = findMatches(invoices, transactions)
 *
 * // Or customize the matching rules
 * const matches = findMatches(invoices, transactions, {
 *   amountTolerance: 0.05,  // 5% tolerance
 *   dateWindowDays: 60,     // 60 day window
 *   minConfidenceScore: 0.6, // 60% minimum confidence
 * })
 *
 * // Access confidence score and breakdown
 * matches.forEach(candidate => {
 *   console.log(`${candidate.invoiceId} -> ${candidate.transactionId}`)
 *   console.log(`Confidence: ${(candidate.confidenceScore * 100).toFixed(0)}%`)
 *   console.log(`Amount match: ${candidate.breakdown.amountMatch}`)
 *   console.log(`Date in window: ${candidate.breakdown.dateInWindow}`)
 * })
 * ```
 *
 * ## React Hook Usage
 *
 * ```typescript
 * import { useMatching } from '@/hooks/useMatching'
 *
 * function MyComponent() {
 *   const { candidates, topMatches, stats, updateConfig } = useMatching({
 *     invoices,
 *     transactions,
 *     config: { amountTolerance: 0.05 },
 *   })
 *
 *   return (
 *     <>
 *       <p>Found {stats.totalCandidates} potential matches</p>
 *       <p>Average confidence: {(stats.averageConfidence * 100).toFixed(0)}%</p>
 *     </>
 *   )
 * }
 * ```
 *
 * ## Algorithm Details
 *
 * ### Amount Score (0-1)
 * - Exact match: 1.0
 * - Within tolerance: Linear decay from 1.0 to 0.0 as difference increases
 * - Outside tolerance: Capped at 0.5 * (1 - percentageDifference / 50)
 *
 * ### Date Score (0-1)
 * - Exact date match: 1.0
 * - Within window: Linear decay from 1.0 to 0.0 as days increase
 * - Outside window: 0.1 (minimal score)
 *
 * ### Reference Score (0-1)
 * - Compares customer name, reference ID, and description
 * - Uses Levenshtein distance and fuzzy matching
 * - Extracts and compares key identifiers (invoice numbers, customer names, etc.)
 *
 * ### Confidence Score (0-1)
 * - Weighted average of amount, date, and reference scores
 * - Default weights: amount 0.4, date 0.3, reference 0.3
 * - Only matches with confidence >= minConfidenceScore are returned
 *
 * ## Configuration
 *
 * See {@link MatchingConfig} for all available options
 *
 * ## Types
 *
 * - {@link Invoice} - Invoice data structure
 * - {@link Transaction} - Transaction data structure
 * - {@link MatchCandidate} - Match result with scores
 * - {@link MatchingConfig} - Configuration options
 *
 * ## Utilities
 *
 * - {@link levenshteinDistance} - Calculate string edit distance
 * - {@link levenshteinSimilarity} - Calculate normalized string similarity
 * - {@link fuzzyScore} - Simple fuzzy matching score
 * - {@link findMatches} - Find all matching candidates
 * - {@link findTopMatches} - Get top N matches per invoice
 * - {@link getMatchingStats} - Calculate matching statistics
 *
 * ## Testing
 *
 * Run tests with:
 * ```typescript
 * import { runAllTests } from '@/utils/matching-engine.test'
 * runAllTests()
 * ```
 */

export * from '@/types/matching'
export * from '@/utils/matching-engine'
export * from '@/utils/string-distance'
export * from '@/utils/matching-utils'
export * from '@/hooks/useMatching'
export * from '@/utils/sample-data'
