/**
 * Type definitions for invoice and transaction matching
 */

/**
 * Represents an invoice in the system
 */
export interface Invoice {
  id: string
  amount: number
  date: Date | string
  dueDate?: Date | string
  customerId: string
  customerName: string
  referenceId?: string
  description?: string
  status?: 'pending' | 'partial' | 'reconciled'
}

/**
 * Represents a transaction (bank or payment processor)
 */
export interface Transaction {
  id: string
  amount: number
  date: Date | string
  description: string
  reference?: string
  source: 'bank' | 'payment_processor' | 'manual'
  status?: 'pending' | 'reconciled'
}

/**
 * Represents a proposed match between an invoice and transaction
 */
export interface MatchCandidate {
  invoiceId: string
  transactionId: string
  confidenceScore: number // 0-1 scale
  amountScore: number // 0-1
  dateScore: number // 0-1
  referenceScore: number // 0-1
  breakdown: {
    amountDifference: number
    dateDifference: number // in days
    amountMatch: boolean
    dateInWindow: boolean
    referenceSimilarity: number
  }
}

/**
 * Configuration for matching rules
 */
export interface MatchingConfig {
  // Amount matching rules
  exactAmountMatch: boolean // If true, only match exact amounts
  amountTolerance: number // Percentage tolerance for amount matching (e.g., 0.05 for 5%)
  amountWeight: number // Weight in final score calculation

  // Date matching rules
  dateWindowDays: number // How many days before/after to consider a match
  dateWeight: number // Weight in final score calculation

  // String matching rules
  referenceSimilarityThreshold: number // Minimum similarity score for reference/customer matching
  referenceWeight: number // Weight in final score calculation

  // Overall matching rules
  minConfidenceScore: number // Minimum confidence score to propose a match (0-1)
}

/**
 * Default configuration for matching
 */
export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  exactAmountMatch: false,
  amountTolerance: 0.02, // 2% tolerance
  amountWeight: 0.4,

  dateWindowDays: 30, // 30 days before/after
  dateWeight: 0.3,

  referenceSimilarityThreshold: 0.5,
  referenceWeight: 0.3,

  minConfidenceScore: 0.5, // 50% minimum confidence
}
