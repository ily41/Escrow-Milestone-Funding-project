'use client'

import { useState } from 'react'

interface MilestoneCreateFormProps {
    onSubmit: (title: string, description: string, percentage: number) => void
    loading: boolean
    remainingPercentage: number
}

export default function MilestoneCreateForm({ onSubmit, loading, remainingPercentage }: MilestoneCreateFormProps) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [percentage, setPercentage] = useState<number | ''>('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (title && percentage) {
            onSubmit(title, description, Number(percentage))
            setTitle('')
            setDescription('')
            setPercentage('')
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
                    Percentage (Remaining: {remainingPercentage}%)
                </label>
                <input
                    type="number"
                    placeholder="1-100"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                    className="input-field w-full"
                    min="1"
                    max={remainingPercentage}
                    required
                />
            </div>

            <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading || (typeof percentage === 'number' && percentage > remainingPercentage)}
            >
                {loading ? 'Creating...' : 'Create Milestone'}
            </button>
        </form>
    )
}
