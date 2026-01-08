/**
 * Demo component showcasing the matching engine
 * Displays matches between invoices and transactions with confidence scores
 */

import { useState } from 'react'
import { useMatching } from '@/hooks/useMatching'
import { SAMPLE_INVOICES, SAMPLE_TRANSACTIONS } from '@/utils/sample-data'
import { ReconciliationPanel } from '@/components/reconciliation-panel'
import type { MatchingConfig } from '@/types/matching'

function ConfidenceBar({ score, width = 'w-24' }: { score: number; width?: string }) {
  const percentage = Math.round(score * 100)
  const bgColor =
    score >= 0.8
      ? 'bg-green-500'
      : score >= 0.6
        ? 'bg-yellow-500'
        : score >= 0.4
          ? 'bg-orange-500'
          : 'bg-red-500'

  return (
    <div className="flex items-center gap-2">
      <div className={`${width} h-2 rounded-full bg-gray-200 overflow-hidden`}>
        <div className={`h-full ${bgColor}`} style={{ width: `${percentage}%` }}></div>
      </div>
      <span className="text-sm font-mono text-gray-600 dark:text-gray-400 w-12">
        {percentage}%
      </span>
    </div>
  )
}

function ConfigPanel({
  config,
  onUpdate,
}: {
  config: MatchingConfig
  onUpdate: (newConfig: Partial<MatchingConfig>) => void
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 font-semibold">Matching Configuration</h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Amount Tolerance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount Tolerance: {(config.amountTolerance * 100).toFixed(1)}%
          </label>
          <input
            type="range"
            min="0"
            max="0.1"
            step="0.01"
            value={config.amountTolerance}
            onChange={(e) =>
              onUpdate({ amountTolerance: parseFloat(e.target.value) })
            }
            className="mt-1 w-full"
          />
        </div>

        {/* Date Window */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date Window: {config.dateWindowDays} days
          </label>
          <input
            type="range"
            min="1"
            max="60"
            step="1"
            value={config.dateWindowDays}
            onChange={(e) =>
              onUpdate({ dateWindowDays: parseInt(e.target.value) })
            }
            className="mt-1 w-full"
          />
        </div>

        {/* Amount Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount Weight: {config.amountWeight.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.amountWeight}
            onChange={(e) =>
              onUpdate({ amountWeight: parseFloat(e.target.value) })
            }
            className="mt-1 w-full"
          />
        </div>

        {/* Date Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Date Weight: {config.dateWeight.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.dateWeight}
            onChange={(e) => onUpdate({ dateWeight: parseFloat(e.target.value) })}
            className="mt-1 w-full"
          />
        </div>

        {/* Reference Weight */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Reference Weight: {config.referenceWeight.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={config.referenceWeight}
            onChange={(e) =>
              onUpdate({ referenceWeight: parseFloat(e.target.value) })
            }
            className="mt-1 w-full"
          />
        </div>

        {/* Minimum Confidence Score */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Min Confidence: {(config.minConfidenceScore * 100).toFixed(0)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.minConfidenceScore}
            onChange={(e) =>
              onUpdate({ minConfidenceScore: parseFloat(e.target.value) })
            }
            className="mt-1 w-full"
          />
        </div>
      </div>
    </div>
  )
}

function MatchesTable({ isLoading, candidates, topMatches }: {
  isLoading: boolean
  candidates: any[]
  topMatches: Map<string, any[]>
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <th className="px-4 py-3 text-left font-semibold">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold">Transaction</th>
              <th className="px-4 py-3 text-left font-semibold">Overall</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Reference</th>
              <th className="px-4 py-3 text-left font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                  Computing matches...
                </td>
              </tr>
            ) : candidates.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                  No matches found
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr
                  key={`${candidate.invoiceId}-${candidate.transactionId}`}
                  className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <td className="px-4 py-3 font-mono">{candidate.invoiceId}</td>
                  <td className="px-4 py-3 font-mono">{candidate.transactionId}</td>
                  <td className="px-4 py-3">
                    <ConfidenceBar
                      score={candidate.confidenceScore}
                      width="w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBar score={candidate.amountScore} width="w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBar score={candidate.dateScore} width="w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <ConfidenceBar
                      score={candidate.referenceScore}
                      width="w-16"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="space-y-1">
                      <div>
                        Amt diff: $
                        {candidate.breakdown.amountDifference.toFixed(2)}
                      </div>
                      <div>
                        Date diff: {candidate.breakdown.dateDifference}d
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MatchingDemo() {
  const [configOverrides, setConfigOverrides] = useState<Partial<MatchingConfig>>({})

  const { candidates, topMatches, stats, config, updateConfig, resetConfig } =
    useMatching({
      invoices: SAMPLE_INVOICES,
      transactions: SAMPLE_TRANSACTIONS,
      config: configOverrides,
    })

  const handleConfigUpdate = (newConfig: Partial<MatchingConfig>) => {
    setConfigOverrides((prev) => ({ ...prev, ...newConfig }))
    updateConfig(newConfig)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoice-Transaction Matching
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Client-side matching engine with configurable rules and confidence scoring
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Invoices</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Transactions</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="text-2xl font-bold">{stats.totalCandidates}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Candidate Matches
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="text-2xl font-bold">
              {(stats.averageConfidence * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Avg Confidence
            </div>
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <h2 className="mb-4 font-semibold">Confidence Distribution</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {stats.confidenceDistribution.high}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                High ≥80%
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.confidenceDistribution.medium}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Medium 50-80%
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {stats.confidenceDistribution.low}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Low &lt;50%
              </div>
            </div>
          </div>
        </div>

        {/* Config Panel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Configuration</h2>
            <button
              onClick={resetConfig}
              className="rounded-md bg-gray-200 px-3 py-1 text-sm font-medium hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              Reset to Defaults
            </button>
          </div>
          <ConfigPanel config={config} onUpdate={handleConfigUpdate} />
        </div>

        {/* Matches Table */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">All Matches</h2>
          <MatchesTable
            isLoading={false}
            candidates={candidates}
            topMatches={topMatches}
          />
        </div>

        {/* Top Matches by Invoice */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Top Match Per Invoice</h2>
          <div className="space-y-2">
            {SAMPLE_INVOICES.map((invoice) => {
              const invoiceMatches = topMatches.get(invoice.id) || []
              const topMatch = invoiceMatches[0]

              return (
                <div
                  key={invoice.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-mono font-semibold">{invoice.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.customerName} - ${invoice.amount.toFixed(2)}
                      </p>
                    </div>
                    {topMatch && (
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold">
                          {topMatch.transactionId}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Confidence:{' '}
                          {(topMatch.confidenceScore * 100).toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>

                  {topMatch ? (
                    <ConfidenceBar
                      score={topMatch.confidenceScore}
                      width="w-48"
                    />
                  ) : (
                    <p className="text-sm text-gray-500">No matches found</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Reconciliation Actions Panel */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          <ReconciliationPanel
            candidates={candidates}
            invoices={SAMPLE_INVOICES}
            transactions={SAMPLE_TRANSACTIONS}
          />
        </div>
      </div>
    </div>
  )
}
