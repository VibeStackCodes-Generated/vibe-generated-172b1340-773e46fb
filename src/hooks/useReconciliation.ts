/**
 * React hook for managing reconciliation state and actions
 * Handles accepting, rejecting, and undoing reconciliations with localStorage persistence
 */

import { useState, useCallback, useEffect } from 'react'
import type { MatchCandidate } from '@/types/matching'

/**
 * Represents a reconciliation record
 */
export interface ReconciliationRecord {
  invoiceId: string
  transactionId: string
  status: 'accepted' | 'rejected'
  timestamp: number
  candidate?: MatchCandidate
}

/**
 * Represents a merged match (two transactions into one)
 */
export interface MergedMatch {
  invoiceId: string
  transactionIds: string[] // Array of merged transaction IDs
  timestamp: number
}

export interface UseReconciliationResult {
  // State
  reconciliations: Map<string, ReconciliationRecord>
  mergedMatches: Map<string, MergedMatch>
  selectedMatches: Set<string> // Key format: invoiceId-transactionId
  undoHistory: (ReconciliationRecord | MergedMatch)[]

  // Actions
  acceptMatch: (invoiceId: string, transactionId: string, candidate?: MatchCandidate) => void
  rejectMatch: (invoiceId: string, transactionId: string) => void
  mergeTransactions: (invoiceId: string, transactionIds: string[]) => void
  toggleSelectMatch: (invoiceId: string, transactionId: string) => void
  selectAllMatches: (matches: MatchCandidate[]) => void
  deselectAllMatches: () => void
  batchAcceptSelected: () => void
  undo: () => void
  clearReconciliations: () => void

  // Queries
  isMatchAccepted: (invoiceId: string, transactionId: string) => boolean
  isMatchRejected: (invoiceId: string, transactionId: string) => boolean
  isMerged: (invoiceId: string) => boolean
  getReconciliationStatus: (
    invoiceId: string,
    transactionId: string
  ) => 'accepted' | 'rejected' | 'pending'
}

const RECONCILIATION_STORAGE_KEY = 'clearcollect_reconciliations'
const MERGED_STORAGE_KEY = 'clearcollect_merged_matches'
const UNDO_HISTORY_STORAGE_KEY = 'clearcollect_undo_history'

/**
 * Hook for managing reconciliation state
 * Persists to localStorage for recovery and undo capability
 */
export function useReconciliation(): UseReconciliationResult {
  // Load initial state from localStorage
  const [reconciliations, setReconciliations] = useState<Map<string, ReconciliationRecord>>(() => {
    try {
      const stored = localStorage.getItem(RECONCILIATION_STORAGE_KEY)
      if (stored) {
        const records = JSON.parse(stored) as ReconciliationRecord[]
        return new Map(records.map((r) => [`${r.invoiceId}-${r.transactionId}`, r]))
      }
    } catch (e) {
      console.error('Failed to load reconciliations from localStorage:', e)
    }
    return new Map()
  })

  const [mergedMatches, setMergedMatches] = useState<Map<string, MergedMatch>>(() => {
    try {
      const stored = localStorage.getItem(MERGED_STORAGE_KEY)
      if (stored) {
        const matches = JSON.parse(stored) as MergedMatch[]
        return new Map(matches.map((m) => [m.invoiceId, m]))
      }
    } catch (e) {
      console.error('Failed to load merged matches from localStorage:', e)
    }
    return new Map()
  })

  const [undoHistory, setUndoHistory] = useState<(ReconciliationRecord | MergedMatch)[]>(() => {
    try {
      const stored = localStorage.getItem(UNDO_HISTORY_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load undo history from localStorage:', e)
    }
    return []
  })

  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())

  // Persist reconciliations to localStorage
  useEffect(() => {
    try {
      const records = Array.from(reconciliations.values())
      localStorage.setItem(RECONCILIATION_STORAGE_KEY, JSON.stringify(records))
    } catch (e) {
      console.error('Failed to persist reconciliations to localStorage:', e)
    }
  }, [reconciliations])

  // Persist merged matches to localStorage
  useEffect(() => {
    try {
      const matches = Array.from(mergedMatches.values())
      localStorage.setItem(MERGED_STORAGE_KEY, JSON.stringify(matches))
    } catch (e) {
      console.error('Failed to persist merged matches to localStorage:', e)
    }
  }, [mergedMatches])

  // Persist undo history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(UNDO_HISTORY_STORAGE_KEY, JSON.stringify(undoHistory))
    } catch (e) {
      console.error('Failed to persist undo history to localStorage:', e)
    }
  }, [undoHistory])

  const acceptMatch = useCallback(
    (invoiceId: string, transactionId: string, candidate?: MatchCandidate) => {
      const key = `${invoiceId}-${transactionId}`
      const record: ReconciliationRecord = {
        invoiceId,
        transactionId,
        status: 'accepted',
        timestamp: Date.now(),
        candidate,
      }

      setReconciliations((prev) => new Map(prev).set(key, record))
      // Add to undo history
      setUndoHistory((prev) => [...prev, record])
    },
    []
  )

  const rejectMatch = useCallback((invoiceId: string, transactionId: string) => {
    const key = `${invoiceId}-${transactionId}`
    const record: ReconciliationRecord = {
      invoiceId,
      transactionId,
      status: 'rejected',
      timestamp: Date.now(),
    }

    setReconciliations((prev) => new Map(prev).set(key, record))
    // Add to undo history
    setUndoHistory((prev) => [...prev, record])
  }, [])

  const mergeTransactions = useCallback((invoiceId: string, transactionIds: string[]) => {
    const merged: MergedMatch = {
      invoiceId,
      transactionIds,
      timestamp: Date.now(),
    }

    setMergedMatches((prev) => new Map(prev).set(invoiceId, merged))
    // Add to undo history
    setUndoHistory((prev) => [...prev, merged])
  }, [])

  const toggleSelectMatch = useCallback((invoiceId: string, transactionId: string) => {
    const key = `${invoiceId}-${transactionId}`
    setSelectedMatches((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }, [])

  const selectAllMatches = useCallback((matches: MatchCandidate[]) => {
    const newSet = new Set<string>()
    matches.forEach((match) => {
      newSet.add(`${match.invoiceId}-${match.transactionId}`)
    })
    setSelectedMatches(newSet)
  }, [])

  const deselectAllMatches = useCallback(() => {
    setSelectedMatches(new Set())
  }, [])

  const batchAcceptSelected = useCallback(() => {
    selectedMatches.forEach((key) => {
      const [invoiceId, transactionId] = key.split('-')
      const record: ReconciliationRecord = {
        invoiceId,
        transactionId,
        status: 'accepted',
        timestamp: Date.now(),
      }
      setReconciliations((prev) => new Map(prev).set(key, record))
    })
    // Add all to undo history as a batch
    const records = Array.from(selectedMatches).map((key) => {
      const [invoiceId, transactionId] = key.split('-')
      return {
        invoiceId,
        transactionId,
        status: 'accepted' as const,
        timestamp: Date.now(),
      }
    })
    setUndoHistory((prev) => [...prev, ...records])
    setSelectedMatches(new Set())
  }, [selectedMatches])

  const undo = useCallback(() => {
    if (undoHistory.length === 0) return

    const lastAction = undoHistory[undoHistory.length - 1]
    setUndoHistory((prev) => prev.slice(0, -1))

    if ('transactionId' in lastAction) {
      // It's a ReconciliationRecord
      const key = `${lastAction.invoiceId}-${lastAction.transactionId}`
      setReconciliations((prev) => {
        const newMap = new Map(prev)
        newMap.delete(key)
        return newMap
      })
    } else {
      // It's a MergedMatch
      setMergedMatches((prev) => {
        const newMap = new Map(prev)
        newMap.delete(lastAction.invoiceId)
        return newMap
      })
    }
  }, [undoHistory])

  const clearReconciliations = useCallback(() => {
    setReconciliations(new Map())
    setMergedMatches(new Map())
    setUndoHistory([])
    setSelectedMatches(new Set())
  }, [])

  const isMatchAccepted = useCallback(
    (invoiceId: string, transactionId: string) => {
      const key = `${invoiceId}-${transactionId}`
      const record = reconciliations.get(key)
      return record?.status === 'accepted'
    },
    [reconciliations]
  )

  const isMatchRejected = useCallback(
    (invoiceId: string, transactionId: string) => {
      const key = `${invoiceId}-${transactionId}`
      const record = reconciliations.get(key)
      return record?.status === 'rejected'
    },
    [reconciliations]
  )

  const isMerged = useCallback(
    (invoiceId: string) => {
      return mergedMatches.has(invoiceId)
    },
    [mergedMatches]
  )

  const getReconciliationStatus = useCallback(
    (invoiceId: string, transactionId: string): 'accepted' | 'rejected' | 'pending' => {
      const key = `${invoiceId}-${transactionId}`
      const record = reconciliations.get(key)
      return record?.status ?? 'pending'
    },
    [reconciliations]
  )

  return {
    reconciliations,
    mergedMatches,
    selectedMatches,
    undoHistory,
    acceptMatch,
    rejectMatch,
    mergeTransactions,
    toggleSelectMatch,
    selectAllMatches,
    deselectAllMatches,
    batchAcceptSelected,
    undo,
    clearReconciliations,
    isMatchAccepted,
    isMatchRejected,
    isMerged,
    getReconciliationStatus,
  }
}
