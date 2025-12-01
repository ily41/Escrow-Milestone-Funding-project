'use client'

import { useState } from 'react'

interface MilestoneCreateFormProps {
    onSubmit: (title: string, description: string, amount: number) => void
    loading: boolean
    remainingAmount: number
    currency: string
}

export default function MilestoneCreateForm({ onSubmit, loading, remainingAmount, currency }: MilestoneCreateFormProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState<number | ''>('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (title && amount) {
            onSubmit(title, description, Number(amount))
            setTitle('')
            setDescription('')
            setAmount('')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
            <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Add New Milestone</h3>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)', opacity: 0.8 }}>Title</label>
                <input
                    type="text"
                    placeholder="Milestone title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field w-full"
                    required
                />
            </div>

            <div className="mb-3">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)', opacity: 0.8 }}>Description</label>
                <textarea
                    placeholder="Describe what will be delivered..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-field w-full"
                    rows={3}
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)', opacity: 0.8 }}>
                    Amount (Remaining: {currency} {remainingAmount})
                </label>
                <input
                    type="number"
                    placeholder={`Amount in ${currency}`}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="input-field w-full"
                    min="0.000000000000000001"
                    max={remainingAmount}
                    step="any"
                    required
                />
            </div>

            <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading || (typeof amount === 'number' && amount > remainingAmount)}
            >
                {loading ? 'Creating...' : 'Create Milestone'}
            </button>
        </form>
    )
}
