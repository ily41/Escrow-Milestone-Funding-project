'use client'

import { useState } from 'react'

interface PledgeFormProps {
  onSubmit: (amount: number) => void
  currency: string
  loading: boolean
}

export default function PledgeForm({ onSubmit, currency, loading }: PledgeFormProps) {
  const [amount, setAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (numAmount > 0) {
      onSubmit(numAmount)
      setAmount('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
          Pledge Amount
        </label>
        <div className="flex gap-2">
          <span className="flex items-center px-3 rounded-l-lg border border-r-0" style={{ backgroundColor: 'var(--border)', borderColor: 'var(--border)', color: 'var(--text)' }}>
            {currency}
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-field rounded-l-none flex-1"
            placeholder="0.00"
            required
          />
        </div>
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? 'Processing...' : 'Submit Pledge'}
      </button>
    </form>
  )
}
