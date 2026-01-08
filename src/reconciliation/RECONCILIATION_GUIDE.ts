/**
 * Reconciliation Guide
 *
 * Complete guide to using the one-click reconciliation system
 * Covers all features and localStorage persistence
 */

/**
 * OVERVIEW
 * ========
 *
 * The reconciliation system allows users to:
 * 1. Accept individual invoice-transaction matches
 * 2. Reject individual matches
 * 3. Merge multiple transactions for a single invoice
 * 4. Undo any action with full history
 * 5. Batch select and accept multiple matches
 * 6. Persist all state to browser localStorage
 *
 */

/**
 * FEATURES
 * ========
 *
 * 1. ACCEPT MATCHES
 * -----------------
 * Accept a candidate match to reconcile an invoice with a transaction
 *
 * Usage:
 *   const { acceptMatch } = useReconciliation()
 *   acceptMatch(invoiceId, transactionId, candidate)
 *
 * State:
 *   - Status changes to 'accepted'
 *   - Stored in reconciliations Map
 *   - Persisted to localStorage
 *   - Added to undo history
 *
 *
 * 2. REJECT MATCHES
 * -----------------
 * Reject a candidate match to exclude it from reconciliation
 *
 * Usage:
 *   const { rejectMatch } = useReconciliation()
 *   rejectMatch(invoiceId, transactionId)
 *
 * State:
 *   - Status changes to 'rejected'
 *   - Stored in reconciliations Map
 *   - Persisted to localStorage
 *   - Added to undo history
 *
 *
 * 3. MERGE TRANSACTIONS
 * --------------------
 * Merge multiple transactions into a single match for an invoice
 * This allows handling cases where a single invoice needs multiple transactions
 *
 * Usage:
 *   const { mergeTransactions } = useReconciliation()
 *   mergeTransactions(invoiceId, [txnId1, txnId2, txnId3])
 *
 * State:
 *   - Creates a MergedMatch record
 *   - Stored in mergedMatches Map
 *   - Persisted to localStorage
 *   - Added to undo history
 *
 * UI-Only Implementation:
 *   - Currently UI-only merge (data structure ready for future API integration)
 *   - Full state management for merge tracking
 *   - Easy to extend with server-side reconciliation
 *
 *
 * 4. UNDO ACTIONS
 * ---------------
 * Undo the most recent action (accept, reject, or merge)
 * Full history is maintained for multiple undos
 *
 * Usage:
 *   const { undo, undoHistory } = useReconciliation()
 *   undo() // Reverts last action
 *   console.log(undoHistory.length) // Check history depth
 *
 * Features:
 *   - Reverts both reconciliations and merged matches
 *   - Maintains full history for navigation
 *   - History persisted to localStorage
 *
 *
 * 5. BATCH SELECT & ACCEPT
 * ------------------------
 * Select multiple matches and accept all with one click
 *
 * Usage:
 *   const {
 *     selectedMatches,
 *     toggleSelectMatch,
 *     selectAllMatches,
 *     deselectAllMatches,
 *     batchAcceptSelected
 *   } = useReconciliation()
 *
 *   // Select individual
 *   toggleSelectMatch(invoiceId, transactionId)
 *
 *   // Select all matches
 *   selectAllMatches(candidates)
 *
 *   // Deselect all
 *   deselectAllMatches()
 *
 *   // Accept all selected
 *   batchAcceptSelected()
 *
 *
 * LOCALSTORAGE PERSISTENCE
 * ========================
 *
 * All state is automatically persisted to three localStorage keys:
 *
 * 1. clearcollect_reconciliations
 *    - Stores all accepted/rejected matches
 *    - Format: ReconciliationRecord[]
 *    - Includes: invoiceId, transactionId, status, timestamp, candidate
 *
 * 2. clearcollect_merged_matches
 *    - Stores all merged transaction groups
 *    - Format: MergedMatch[]
 *    - Includes: invoiceId, transactionIds[], timestamp
 *
 * 3. clearcollect_undo_history
 *    - Stores complete action history
 *    - Format: (ReconciliationRecord | MergedMatch)[]
 *    - Allows unlimited undo capability
 *
 * Recovery:
 *   - On component mount, state is loaded from localStorage
 *   - User sees their previous reconciliation state
 *   - No data loss on page refresh
 *
 *
 * QUERY FUNCTIONS
 * ================
 *
 * Check reconciliation status:
 *   const { getReconciliationStatus } = useReconciliation()
 *   const status = getReconciliationStatus(invoiceId, txnId)
 *   // Returns: 'accepted' | 'rejected' | 'pending'
 *
 * Check if match is accepted:
 *   const { isMatchAccepted } = useReconciliation()
 *   if (isMatchAccepted(invoiceId, txnId)) { ... }
 *
 * Check if match is rejected:
 *   const { isMatchRejected } = useReconciliation()
 *   if (isMatchRejected(invoiceId, txnId)) { ... }
 *
 * Check if invoice has merged matches:
 *   const { isMerged } = useReconciliation()
 *   if (isMerged(invoiceId)) { ... }
 *
 *
 * UI COMPONENTS
 * ==============
 *
 * ReconciliationPanel
 * -------------------
 * Complete UI for all reconciliation features
 *
 * Props:
 *   - candidates: MatchCandidate[] - Array of match candidates
 *   - invoices: Invoice[] - Lookup for invoice details
 *   - transactions: Transaction[] - Lookup for transaction details
 *
 * Features included:
 *   - Individual accept/reject buttons
 *   - Batch selection and batch accept
 *   - Merge UI (placeholder for merge modal)
 *   - Undo button with history count
 *   - Statistics (accepted, rejected, pending counts)
 *   - Merged matches display
 *   - Full keyboard accessibility
 *
 * Example:
 *   <ReconciliationPanel
 *     candidates={matchCandidates}
 *     invoices={invoices}
 *     transactions={transactions}
 *   />
 *
 *
 * INTEGRATION EXAMPLES
 * ====================
 *
 * 1. Accept a single match:
 *    const { acceptMatch } = useReconciliation()
 *    acceptMatch('INV-001', 'TXN-001', candidateObject)
 *
 * 2. Batch accept all candidates above 80% confidence:
 *    const { batchAcceptSelected, selectAllMatches } = useReconciliation()
 *    const highConfidence = candidates.filter(c => c.confidenceScore >= 0.8)
 *    selectAllMatches(highConfidence)
 *    batchAcceptSelected()
 *
 * 3. Merge two transactions for an invoice:
 *    const { mergeTransactions } = useReconciliation()
 *    mergeTransactions('INV-001', ['TXN-001', 'TXN-002'])
 *
 * 4. Undo last N actions:
 *    const { undo } = useReconciliation()
 *    for (let i = 0; i < 5; i++) undo()
 *
 * 5. Check if all matches are reconciled:
 *    const { reconciliations } = useReconciliation()
 *    const allReconciled = candidates.every(c =>
 *      reconciliations.has(`${c.invoiceId}-${c.transactionId}`)
 *    )
 *
 *
 * DATA STRUCTURES
 * ================
 *
 * ReconciliationRecord
 * {
 *   invoiceId: string
 *   transactionId: string
 *   status: 'accepted' | 'rejected'
 *   timestamp: number
 *   candidate?: MatchCandidate // Optional, stored with accept
 * }
 *
 * MergedMatch
 * {
 *   invoiceId: string
 *   transactionIds: string[] // Array of merged transaction IDs
 *   timestamp: number
 * }
 *
 *
 * FUTURE EXTENSIONS
 * ==================
 *
 * 1. Server Synchronization
 *    - Add API calls to save reconciliations to backend
 *    - Implement conflict resolution for concurrent edits
 *    - Support multi-user reconciliation workflows
 *
 * 2. Merge Modal
 *    - Replace placeholder merge UI with full modal
 *    - Allow selection of specific transactions to merge
 *    - Preview merged amounts and dates
 *
 * 3. Advanced Undo
 *    - Replace linear undo with branching history
 *    - Allow jumping to specific points in history
 *    - Implement redo functionality
 *
 * 4. Reconciliation Rules
 *    - Auto-accept matches above confidence threshold
 *    - Custom reconciliation workflows
 *    - Approval routing for high-value matches
 *
 * 5. Analytics
 *    - Track reconciliation patterns
 *    - Export reconciliation reports
 *    - Performance metrics
 *
 */
