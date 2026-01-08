/**
 * Reusable confirmation dialog component for destructive actions
 * Displays action details, undo tips, and confirmation/cancel buttons
 */

import { ReactNode } from 'react'

interface ConfirmationDialogProps {
  title: string
  description: string
  actionLabel: string
  cancelLabel?: string
  isDangerous?: boolean
  isLoading?: boolean
  onConfirm: () => void | Promise<void>
  onCancel: () => void
  children?: ReactNode
  undoTip?: string
}

function AlertCircleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CheckCircleIcon({ className = 'h-5 w-5' }: { className?: string }) {
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

function LightBulbIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM15.657 14.243a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM11 17a1 1 0 102 0v-1a1 1 0 10-2 0v1zM4.343 14.243a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414l-.707.707zM2 10a1 1 0 011-1h1a1 1 0 110 2H3a1 1 0 01-1-1zM4.343 5.757a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 011.414-1.414l.707.707z" />
    </svg>
  )
}

/**
 * Modal backdrop overlay
 */
function DialogBackdrop({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
      onClick={onClick}
      role="presentation"
    />
  )
}

/**
 * Confirmation dialog component
 * Provides a reusable dialog for confirming destructive or important actions
 */
export function ConfirmationDialog({
  title,
  description,
  actionLabel,
  cancelLabel = 'Cancel',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  children,
  undoTip,
}: ConfirmationDialogProps) {
  const iconColor = isDangerous ? 'text-red-600' : 'text-blue-600'
  const buttonColor = isDangerous
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-blue-600 hover:bg-blue-700'

  return (
    <>
      <DialogBackdrop onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg max-w-md w-full space-y-4 p-6 border border-gray-200 dark:border-gray-800">
          {/* Header */}
          <div className="flex items-start gap-3">
            {isDangerous ? (
              <AlertCircleIcon className={`${iconColor} flex-shrink-0 mt-0.5`} />
            ) : (
              <CheckCircleIcon className={`${iconColor} flex-shrink-0 mt-0.5`} />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>
            </div>
          </div>

          {/* Content */}
          {children && <div className="text-sm text-gray-700 dark:text-gray-300">{children}</div>}

          {/* Undo Tip */}
          {undoTip && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 flex gap-2">
              <LightBulbIcon className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">Undo Tip</p>
                <p className="text-xs text-blue-800 dark:text-blue-200 mt-0.5">{undoTip}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonColor}`}
            >
              {isLoading ? 'Processing...' : actionLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmationDialog
