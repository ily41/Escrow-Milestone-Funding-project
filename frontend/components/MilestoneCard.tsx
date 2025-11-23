'use client'

import { useState } from 'react'
import type { Milestone } from '@/lib/types'
import { format } from 'date-fns'
import { openVoting, createVote, releaseFunds } from '@/lib/api'
import { useConfirm } from '@/hooks/useConfirm'

interface MilestoneCardProps {
  milestone: Milestone
  projectId: number
  onUpdate: () => void
}

export default function MilestoneCard({ milestone, projectId, onUpdate }: MilestoneCardProps) {
  const { confirm, ConfirmComponent } = useConfirm()
  const [loading, setLoading] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const handleOpenVoting = async () => {
    setLoading(true)
    try {
      await openVoting(milestone.id)
      onUpdate()
      alert('Voting opened!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to open voting')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = async (decision: 'approve' | 'reject') => {
    setLoading(true)
    try {
      await createVote({ milestone: milestone.id, decision })
      setHasVoted(true)
      onUpdate()
      alert(`Vote submitted: ${decision}`)
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to submit vote')
    } finally {
      setLoading(false)
    }
  }

  const handleRelease = async () => {
    const confirmed = await confirm({
      title: 'Release Funds',
      message: 'Release funds for this milestone?',
      confirmText: 'Release',
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return
    setLoading(true)
    try {
      await releaseFunds(milestone.id)
      onUpdate()
      alert('Funds released successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to release funds')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'paid':
        return { backgroundColor: 'var(--success)', opacity: 0.2, color: 'var(--success)' }
      case 'rejected':
        return { backgroundColor: 'var(--primary)', opacity: 0.2, color: 'var(--primary)' }
      case 'voting':
        return { backgroundColor: 'var(--primary)', opacity: 0.1, color: 'var(--primary)' }
      default:
        return { backgroundColor: 'var(--border)', opacity: 0.5, color: 'var(--text)' }
    }
  }

  const statusStyle = getStatusColor(milestone.status)

  return (
    <>
      {ConfirmComponent}
      <div className="rounded-lg p-4" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Milestone {milestone.order_index}: {milestone.title}
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text)', opacity: 0.8 }}>{milestone.description}</p>
        </div>
        <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: statusStyle.backgroundColor, color: statusStyle.color }}>
          {milestone.status}
        </span>
      </div>

      <div className="flex justify-between items-center text-sm mb-3" style={{ color: 'var(--text)', opacity: 0.7 }}>
        <span>Target: {milestone.target_amount}</span>
        {milestone.due_date && (
          <span>Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}</span>
        )}
      </div>

      {milestone.status === 'voting' && (
        <div className="mb-3 p-3 rounded" style={{ backgroundColor: 'var(--primary)', opacity: 0.1 }}>
          <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--text)' }}>
            <span>Approve: {milestone.approve_votes_count || 0}</span>
            <span>Reject: {milestone.reject_votes_count || 0}</span>
          </div>
          {!hasVoted && (
            <div className="flex gap-2">
              <button
                onClick={() => handleVote('approve')}
                className="btn-primary flex-1 text-sm"
                disabled={loading}
              >
                Approve
              </button>
              <button
                onClick={() => handleVote('reject')}
                className="px-4 py-2 rounded-lg text-sm flex-1 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--light-cream)' }}
                disabled={loading}
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}

      {milestone.status === 'pending' && (
        <button
          onClick={handleOpenVoting}
          className="btn-secondary text-sm"
          disabled={loading}
        >
          Open Voting
        </button>
      )}

      {milestone.status === 'approved' && (
        <button
          onClick={handleRelease}
          className="btn-primary text-sm"
          disabled={loading}
        >
          Release Funds
        </button>
      )}
    </div>
    </>
  )
}
