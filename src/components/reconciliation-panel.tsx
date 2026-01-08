/**
 * Reconciliation panel component for one-click matching actions
 * Provides UI for accepting, rejecting, merging, and undoing reconciliations
 */

import { useState } from 'react'
import type { MatchCandidate, Invoice, Transaction } from '@/types/matching'
import { useReconciliation } from '@/hooks/useReconciliation'

// Simple SVG Icons
function CheckCircleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function XCircleIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function Merge2Icon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-6m0 0V3a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6"
      />
    </svg>
  )
}

function RotateCcwIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  )
}

function CheckIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

interface ReconciliationPanelProps {
  candidates: MatchCandidate[]
  invoices: Invoice[]
  transactions: Transaction[]
}

function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100)
  const bgColor =
    score >= 0.8
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : score >= 0.6
        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        : score >= 0.4
          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${bgColor}`}>
      {percentage}%
    </span>
  )
}

function StatusBadge({ status }: { status: 'accepted' | 'rejected' | 'pending' }) {
  const styles = {
    accepted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

function MatchRow({
  candidate,
  invoice,
  transaction,
  status,
  isSelected,
  onAccept,
  onReject,
  onToggleSelect,
  onMerge,
}: {
  candidate: MatchCandidate
  invoice?: Invoice
  transaction?: Transaction
  status: 'accepted' | 'rejected' | 'pending'
  isSelected: boolean
  onAccept: () => void
  onReject: () => void
  onToggleSelect: () => void
  onMerge: () => void
}) {
  const isDisabled = status !== 'pending'

  return (
    <div
      className={`flex items-center gap-4 rounded-lg border p-4 transition-all ${
        status === 'accepted'
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          : status === 'rejected'
            ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
            : isSelected
              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
              : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950'
      }`}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        disabled={isDisabled}
        className="h-4 w-4 cursor-pointer rounded border-gray-300"
      />

      {/* Match Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-mono font-semibold text-sm">
            {invoice?.id || candidate.invoiceId}
          </h4>
          <span className="text-gray-500 dark:text-gray-400">→</span>
          <h4 className="font-mono font-semibold text-sm">
            {transaction?.id || candidate.transactionId}
          </h4>
        </div>

        <div className="flex flex-wrap gap-2 items-center text-xs">
          {invoice && (
            <div className="text-gray-600 dark:text-gray-400">
              {invoice.customerName} - ${invoice.amount.toFixed(2)}
            </div>
          )}
          {transaction && (
            <div className="text-gray-600 dark:text-gray-400">
              {transaction.description}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>Amt diff: ${candidate.breakdown.amountDifference.toFixed(2)}</div>
          <div>Date diff: {candidate.breakdown.dateDifference}d</div>
          {candidate.breakdown.referenceSimilarity > 0 && (
            <div>Ref similarity: {Math.round(candidate.breakdown.referenceSimilarity * 100)}%</div>
          )}
        </div>
      </div>

      {/* Confidence */}
      <div className="flex items-center gap-3">
        <ConfidenceBadge score={candidate.confidenceScore} />

        {/* Status */}
        <StatusBadge status={status} />

        {/* Actions */}
        {status === 'pending' && (
          <div className="flex items-center gap-2">
            <button
              onClick={onAccept}
              className="rounded-md bg-green-600 hover:bg-green-700 text-white p-2 transition-colors"
              title="Accept match"
              aria-label="Accept match"
            >
              <CheckCircleIcon />
            </button>
            <button
              onClick={onReject}
              className="rounded-md bg-red-600 hover:bg-red-700 text-white p-2 transition-colors"
              title="Reject match"
              aria-label="Reject match"
            >
              <XCircleIcon />
            </button>
            <button
              onClick={onMerge}
              className="rounded-md bg-blue-600 hover:bg-blue-700 text-white p-2 transition-colors"
              title="Merge transactions"
              aria-label="Merge transactions"
            >
              <Merge2Icon />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function ReconciliationPanel({
  candidates,
  invoices,
  transactions,
}: ReconciliationPanelProps) {
  const {
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
    getReconciliationStatus,
  } = useReconciliation()

  const [mergeState, setMergeState] = useState<{
    enabled: boolean
    invoiceId?: string
    selectedTxnIds: string[]
  }>({
    enabled: false,
    selectedTxnIds: [],
  })

  // Build lookup maps
  const invoiceMap = new Map(invoices.map((i) => [i.id, i]))
  const transactionMap = new Map(transactions.map((t) => [t.id, t]))

  // Count reconciled matches
  const acceptedCount = Array.from(reconciliations.values()).filter((r) => r.status === 'accepted').length
  const rejectedCount = Array.from(reconciliations.values()).filter((r) => r.status === 'rejected').length
  const pendingCount = candidates.length - acceptedCount - rejectedCount

  const handleMergeClick = () => {
    if (mergeState.selectedTxnIds.length >= 2 && mergeState.invoiceId) {
      mergeTransactions(mergeState.invoiceId, mergeState.selectedTxnIds)
      setMergeState({ enabled: false, invoiceId: undefined, selectedTxnIds: [] })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Reconciliation Actions</h2>
          {undoHistory.length > 0 && (
            <button
              onClick={undo}
              className="inline-flex items-center gap-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 px-3 py-2 text-sm font-medium transition-colors"
              title={`Undo last action (${undoHistory.length} in history)`}
            >
              <RotateCcwIcon />
              Undo ({undoHistory.length})
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
            <div className="text-2xl font-bold text-green-600">{acceptedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Accepted</div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Rejected</div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950">
            <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
        </div>
      </div>

      {/* Batch Actions */}
      {candidates.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {selectedMatches.size > 0 && `${selectedMatches.size} match${selectedMatches.size !== 1 ? 'es' : ''} selected`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedMatches.size > 0 ? (
              <>
                <button
                  onClick={batchAcceptSelected}
                  className="inline-flex items-center gap-2 rounded-md bg-green-600 hover:bg-green-700 text-white px-3 py-2 text-sm font-medium transition-colors"
                >
                  <CheckIcon />
                  Accept All ({selectedMatches.size})
                </button>
                <button
                  onClick={deselectAllMatches}
                  className="rounded-md bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Deselect
                </button>
              </>
            ) : (
              <button
                onClick={() => selectAllMatches(candidates)}
                className="rounded-md bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-medium transition-colors"
              >
                Select All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Matches List */}
      <div className="space-y-3">
        {candidates.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-950">
            <p className="text-gray-500 dark:text-gray-400">No candidate matches to reconcile</p>
          </div>
        ) : (
          candidates.map((candidate) => {
            const key = `${candidate.invoiceId}-${candidate.transactionId}`
            const status = getReconciliationStatus(candidate.invoiceId, candidate.transactionId)
            const invoice = invoiceMap.get(candidate.invoiceId)
            const transaction = transactionMap.get(candidate.transactionId)

            return (
              <MatchRow
                key={key}
                candidate={candidate}
                invoice={invoice}
                transaction={transaction}
                status={status}
                isSelected={selectedMatches.has(key)}
                onAccept={() => acceptMatch(candidate.invoiceId, candidate.transactionId, candidate)}
                onReject={() => rejectMatch(candidate.invoiceId, candidate.transactionId)}
                onToggleSelect={() => toggleSelectMatch(candidate.invoiceId, candidate.transactionId)}
                onMerge={() => {
                  // Simple merge UI - for more complex merges, a modal would be better
                  console.log('Merge initiated for:', key)
                }}
              />
            )
          })
        )}
      </div>

      {/* Merged Matches Info */}
      {mergedMatches.size > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Merged Matches</h3>
          <div className="space-y-2">
            {Array.from(mergedMatches.values()).map((merge) => (
              <div key={merge.invoiceId} className="text-sm text-purple-800 dark:text-purple-200">
                <span className="font-mono">{merge.invoiceId}</span> merged with{' '}
                <span className="font-mono">{merge.transactionIds.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
