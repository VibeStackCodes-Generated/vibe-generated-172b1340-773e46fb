/**
 * Reconciliation demo component showcasing one-click reconciliation features
 * Demonstrates accepting, rejecting, merging, and undoing reconciliations
 */

import { useMatching } from '@/hooks/useMatching'
import { SAMPLE_INVOICES, SAMPLE_TRANSACTIONS } from '@/utils/sample-data'
import { ReconciliationPanel } from '@/components/reconciliation-panel'

/**
 * Demo component showing reconciliation features in action
 * Includes the matching engine and reconciliation UI
 */
export function ReconciliationDemo() {
  // Get candidate matches from the matching engine
  const { candidates } = useMatching({
    invoices: SAMPLE_INVOICES,
    transactions: SAMPLE_TRANSACTIONS,
  })

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            One-Click Reconciliation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Accept, reject, merge, or undo invoice-transaction matches with full localStorage persistence
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">✓ Accept Matches</h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Click the green checkmark to accept a match. Status persists in localStorage.
            </p>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">✗ Reject Matches</h3>
            <p className="text-sm text-red-800 dark:text-red-200">
              Click the red X to reject a match and exclude it from reconciliation.
            </p>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">↔ Merge Transactions</h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Click the merge icon to combine multiple transactions into a single match for an invoice.
            </p>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">↶ Undo Actions</h3>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Click Undo to revert the last action. Full history is maintained in localStorage.
            </p>
          </div>

          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">☑ Batch Operations</h3>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Select multiple matches and accept all with one click. Checkbox selection is preserved.
            </p>
          </div>

          <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">💾 Persistent State</h3>
            <p className="text-sm text-indigo-800 dark:text-indigo-200">
              All reconciliations are saved to localStorage. Page refresh preserves your work.
            </p>
          </div>
        </div>

        {/* Main Reconciliation Panel */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <ReconciliationPanel
            candidates={candidates}
            invoices={SAMPLE_INVOICES}
            transactions={SAMPLE_TRANSACTIONS}
          />
        </div>

        {/* Instructions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">How to Use</h2>
          <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300 list-decimal list-inside">
            <li>
              <strong>Review Matches:</strong> Each row shows an invoice-transaction pair with a confidence score.
            </li>
            <li>
              <strong>Accept Individual:</strong> Click the green ✓ button to accept a single match.
            </li>
            <li>
              <strong>Reject Individual:</strong> Click the red ✗ button to reject a single match.
            </li>
            <li>
              <strong>Batch Select:</strong> Check the boxes next to matches you want to select together.
            </li>
            <li>
              <strong>Batch Accept:</strong> Click "Accept All" to accept all selected matches at once.
            </li>
            <li>
              <strong>Merge Transactions:</strong> Click the merge icon to combine multiple transactions for one invoice.
            </li>
            <li>
              <strong>Undo Actions:</strong> Click "Undo" button to revert your last action. The undo history is tracked.
            </li>
            <li>
              <strong>Persistent State:</strong> Refresh the page - your reconciliations are saved in browser storage.
            </li>
          </ol>
        </div>

        {/* Statistics */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="text-lg font-semibold mb-4">Data Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600 dark:text-gray-400">Total Invoices</div>
              <div className="text-2xl font-bold">{SAMPLE_INVOICES.length}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Total Transactions</div>
              <div className="text-2xl font-bold">{SAMPLE_TRANSACTIONS.length}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Candidate Matches</div>
              <div className="text-2xl font-bold">{candidates.length}</div>
            </div>
            <div>
              <div className="text-gray-600 dark:text-gray-400">Avg Confidence</div>
              <div className="text-2xl font-bold">
                {candidates.length > 0
                  ? Math.round(
                      (candidates.reduce((sum, c) => sum + c.confidenceScore, 0) /
                        candidates.length) *
                        100
                    )
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
