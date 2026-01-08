/**
 * React hook for using the matching engine
 */

import { useMemo, useState, useCallback } from 'react'
import type {
  Invoice,
  Transaction,
  MatchCandidate,
  MatchingConfig,
} from '@/types/matching'
import { DEFAULT_MATCHING_CONFIG } from '@/types/matching'
import {
  findMatches,
  findTopMatches,
  getMatchingStats,
  type MatchingStats,
} from '@/utils/matching-engine'

export interface UseMatchingOptions {
  invoices: Invoice[]
  transactions: Transaction[]
  config?: Partial<MatchingConfig>
  topN?: number // Only used in findTopMatches mode
}

export interface UseMatchingResult {
  // All matches found
  candidates: MatchCandidate[]

  // Top matches by invoice
  topMatches: Map<string, MatchCandidate[]>

  // Statistics about the matches
  stats: MatchingStats

  // Configuration being used
  config: MatchingConfig

  // Update configuration and re-run matching
  updateConfig: (newConfig: Partial<MatchingConfig>) => void

  // Reset config to defaults
  resetConfig: () => void

  // Loading state
  isLoading: boolean
}

/**
 * Hook for matching invoices to transactions
 * Automatically re-runs matching when inputs or config changes
 */
export function useMatching({
  invoices,
  transactions,
  config: userConfig,
  topN = 3,
}: UseMatchingOptions): UseMatchingResult {
  // Merge user config with defaults
  const [config, setConfig] = useState<MatchingConfig>(() => ({
    ...DEFAULT_MATCHING_CONFIG,
    ...(userConfig || {}),
  }))

  // Calculate matches whenever invoices, transactions, or config changes
  const { candidates, topMatches, stats } = useMemo(() => {
    // Find all matches
    const allMatches = findMatches(invoices, transactions, config)

    // Find top matches
    const topMatchesMap = findTopMatches(
      invoices,
      transactions,
      topN,
      config
    )

    // Get statistics
    const matchStats = getMatchingStats(allMatches)

    return {
      candidates: allMatches,
      topMatches: topMatchesMap,
      stats: matchStats,
    }
  }, [invoices, transactions, config, topN])

  const updateConfig = useCallback((newConfig: Partial<MatchingConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }))
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_MATCHING_CONFIG)
  }, [])

  return {
    candidates,
    topMatches,
    stats,
    config,
    updateConfig,
    resetConfig,
    isLoading: false,
  }
}

/**
 * Hook for getting just the top matches for specific invoices
 * More lightweight than useMatching if you only need top matches
 */
export function useTopMatches(
  invoices: Invoice[],
  transactions: Transaction[],
  topN: number = 3,
  config?: Partial<MatchingConfig>
): Map<string, MatchCandidate[]> {
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_MATCHING_CONFIG, ...(config || {}) }),
    [config]
  )

  return useMemo(
    () => findTopMatches(invoices, transactions, topN, finalConfig),
    [invoices, transactions, topN, finalConfig]
  )
}
