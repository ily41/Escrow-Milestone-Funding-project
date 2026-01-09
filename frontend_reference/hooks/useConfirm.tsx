'use client'

import { useState, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info'
}

export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean
    options: ConfirmOptions | null
    resolve: ((value: boolean) => void) | null
  }>({
    isOpen: false,
    options: null,
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options: {
          title: options.title || 'Confirm Action',
          message: options.message,
          confirmText: options.confirmText,
          cancelText: options.cancelText,
          type: options.type || 'info',
        },
        resolve,
      })
    })
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(true)
    }
    setConfirmState({ isOpen: false, options: null, resolve: null })
  }, [confirmState])

  const handleCancel = useCallback(() => {
    if (confirmState.resolve) {
      confirmState.resolve(false)
    }
    setConfirmState({ isOpen: false, options: null, resolve: null })
  }, [confirmState])

  const ConfirmComponent = confirmState.options ? (
    <ConfirmDialog
      isOpen={confirmState.isOpen}
      title={confirmState.options.title || 'Confirm Action'}
      message={confirmState.options.message}
      confirmText={confirmState.options.confirmText}
      cancelText={confirmState.options.cancelText}
      type={confirmState.options.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  ) : null

  return { confirm, ConfirmComponent }
}

