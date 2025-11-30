'use client'

import { useState } from 'react'
import type { Milestone } from '@/lib/types'
import { format } from 'date-fns'
import {
  useOpenVotingMutation,
  useVoteOnMilestoneMutation,
  useReleaseFundsMutation,
  useDeleteMilestoneMutation,
} from '@/lib/api'
import { useConfirm } from '@/hooks/useConfirm'

interface MilestoneCardProps {
  milestone: Milestone
  projectId: string | number
  onUpdate: () => void
}

// SVG Icon Components
const PendingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const VotingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 10H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

const OpenVotingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M5 10H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M6 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ReleaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V8M8 8L5 5M8 8L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 10H13C13.5523 10 14 10.4477 14 11V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V11C2 10.4477 2.44772 10 3 10Z" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2H10M2 4H14M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 7V11M10 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ApproveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const RejectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
)

export default function MilestoneCard({ milestone, projectId, onUpdate }: MilestoneCardProps) {
  const { confirm, ConfirmComponent } = useConfirm()
  const [hasVoted, setHasVoted] = useState(false)

  const [openVoting, { isLoading: isOpeningVoting }] = useOpenVotingMutation()
  const [vote, { isLoading: isVoting }] = useVoteOnMilestoneMutation()
  const [releaseFunds, { isLoading: isReleasing }] = useReleaseFundsMutation()
  const [deleteMilestone, { isLoading: isDeleting }] = useDeleteMilestoneMutation()

  const handleOpenVoting = async () => {
    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        alert('Milestone ID not found')
        return
      }
      await openVoting({ milestoneId }).unwrap()
      onUpdate()
      alert('Voting opened!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to open voting'
      alert(errorMessage)
    }
  }

  const handleVote = async (decision: 'approve' | 'reject') => {
    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        alert('Milestone ID not found')
        return
      }
      await vote({ milestone_id: milestoneId, decision }).unwrap()
      setHasVoted(true)
      onUpdate()
      alert(`Vote submitted: ${decision}`)
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to submit vote'
      alert(errorMessage)
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

    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        alert('Milestone ID not found')
        return
      }
      await releaseFunds({ milestoneId }).unwrap()
      onUpdate()
      alert('Funds released successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to release funds'
      alert(errorMessage)
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: 'Delete Milestone',
      message: 'Are you sure you want to delete this milestone? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        alert('Milestone ID not found')
        return
      }
      await deleteMilestone({ 
        projectId: String(projectId), 
        milestoneId: milestoneId
      }).unwrap()
      onUpdate()
      alert('Milestone deleted successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to delete milestone'
      alert(errorMessage)
    }
  }

  const getStatusConfig = (status: string) => {
    const statusLower = status?.toLowerCase() || 'pending'
    switch (statusLower) {
      case 'completed':
      case 'approved':
      case 'paid':
        return {
          bg: '#4CAF50',
          text: 'white',
          Icon: CheckIcon,
          label: 'Completed'
        }
      case 'rejected':
        return {
          bg: '#ef4444',
          text: 'white',
          Icon: XIcon,
          label: 'Rejected'
        }
      case 'voting':
        return {
          bg: '#f59e0b',
          text: 'white',
          Icon: VotingIcon,
          label: 'Voting'
        }
      case 'pending':
      default:
        return {
          bg: 'var(--color-warm-beige)',
          text: 'var(--color-text)',
          Icon: PendingIcon,
          label: 'Pending'
        }
    }
  }

  const statusConfig = getStatusConfig(milestone.status)
  const StatusIcon = statusConfig.Icon
  const loading = isOpeningVoting || isVoting || isReleasing || isDeleting
  const percentage = milestone.percentage || 0
  const milestoneStatus = String(milestone.status || '').toLowerCase()
  const canDelete = milestoneStatus !== 'pending' && milestoneStatus !== 'voting'

  return (
    <>
      {ConfirmComponent}
      <div className="card relative overflow-hidden transition-all duration-300 hover:shadow-lg">
        {/* Status Badge - Top Right */}
        <div
          className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          style={{ 
            backgroundColor: statusConfig.bg,
            color: statusConfig.text
          }}
        >
          <StatusIcon />
          <span>{statusConfig.label}</span>
        </div>

        <div className="pr-24">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              {milestone.title}
            </h3>
            {milestone.description && (
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
                {milestone.description}
              </p>
            )}
          </div>

          {/* Percentage and Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                Funding Allocation
              </span>
              <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                {percentage}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-warm-beige)', opacity: 0.3 }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: 'var(--color-primary)'
                }}
              />
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {milestone.funding_amount && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-light-cream)', border: '1px solid var(--color-warm-beige)' }}>
                <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                  Target Amount
                </div>
                <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                  {milestone.target_amount || milestone.funding_amount}
                </div>
              </div>
            )}
            {milestone.due_date && (() => {
              const date = new Date(milestone.due_date)
              if (isNaN(date.getTime())) return null
              return (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-light-cream)', border: '1px solid var(--color-warm-beige)' }}>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                    Due Date
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                    {format(date, 'MMM d, yyyy')}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Voting Section */}
          {milestoneStatus === 'voting' && (
            <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-light-cream)', border: '2px solid var(--color-warm-beige)' }}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#4CAF50' }}>
                      {milestone.approve_votes_count || 0}
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color: 'var(--color-text)' }}>Approve</div>
                  </div>
                  <div className="w-px h-10" style={{ backgroundColor: 'var(--color-warm-beige)' }} />
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#ef4444' }}>
                      {milestone.reject_votes_count || 0}
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color: 'var(--color-text)' }}>Reject</div>
                  </div>
                </div>
              </div>
              {!hasVoted && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleVote('approve')}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#4CAF50', color: 'white' }}
                    disabled={loading}
                  >
                    <ApproveIcon />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => handleVote('reject')}
                    className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#ef4444', color: 'white' }}
                    disabled={loading}
                  >
                    <RejectIcon />
                    <span>Reject</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {milestoneStatus === 'pending' && (
              <button
                onClick={handleOpenVoting}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                disabled={loading}
              >
                <OpenVotingIcon />
                <span>Open Voting</span>
              </button>
            )}

            {milestoneStatus === 'approved' && (
              <button
                onClick={handleRelease}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#4CAF50', color: 'white' }}
                disabled={loading}
              >
                <ReleaseIcon />
                <span>Release Funds</span>
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
                disabled={loading}
                title="Delete milestone"
              >
                <DeleteIcon />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
