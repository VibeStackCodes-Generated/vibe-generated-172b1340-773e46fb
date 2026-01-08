/**
 * Reconciliation module exports
 * Provides components and hooks for one-click invoice-transaction matching
 */

// Hook exports
export { useReconciliation, type UseReconciliationResult } from '@/hooks/useReconciliation'
export type { ReconciliationRecord, MergedMatch } from '@/hooks/useReconciliation'

// Component exports
export { ReconciliationPanel } from '@/components/reconciliation-panel'
export { ReconciliationDemo } from '@/components/reconciliation-demo'
