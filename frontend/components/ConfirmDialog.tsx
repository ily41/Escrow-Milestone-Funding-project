'use client'

import { useEffect } from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  type?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'info',
}: ConfirmDialogProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return {
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-text)',
        }
      case 'warning':
        return {
          backgroundColor: 'var(--secondary)',
          color: 'var(--text)',
        }
      default:
        return {
          backgroundColor: 'var(--primary)',
          color: 'var(--primary-text)',
        }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={onCancel}
      >
        {/* Dialog */}
        <div
          className="relative w-full max-w-md rounded-lg shadow-2xl transform animate-slide-in"
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Content */}
          <div className="p-6">
            {/* Icon */}
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full" style={getConfirmButtonStyle()}>
              {type === 'danger' && (
                <svg
                  className="w-8 h-8"
                  style={{ color: 'var(--primary-text)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {type === 'warning' && (
                <svg
                  className="w-8 h-8"
                  style={{ color: 'var(--text)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              )}
              {type === 'info' && (
                <svg
                  className="w-8 h-8"
                  style={{ color: 'var(--primary-text)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center mb-3" style={{ color: 'var(--text)' }}>
              {title}
            </h3>

            {/* Message */}
            <p className="text-center mb-6" style={{ color: 'var(--text)', opacity: 0.8 }}>
              {message}
            </p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  border: '2px solid var(--border)',
                }}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 hover:shadow-lg"
                style={getConfirmButtonStyle()}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

