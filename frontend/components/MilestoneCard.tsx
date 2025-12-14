'use client'

import { useState } from 'react'
import type { Milestone } from '@/lib/types'
import { format } from 'date-fns'
import {
  useOpenVotingMutation,
  useVoteOnMilestoneMutation,
  useReleaseFundsMutation,
  useDeleteMilestoneMutation,
  useActivateMilestoneMutation,
} from '@/lib/api'
import { useConfirm } from '@/hooks/useConfirm'
import { toast } from '@/components/ui/Toast'

interface MilestoneCardProps {
  milestone: Milestone
  projectId: string | number
  onUpdate: () => void
}

// SVG Icon Components
const PendingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const VotingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 10H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const OpenVotingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="12" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M5 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 10H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 2V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ReleaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2V8M8 8L5 5M8 8L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 10H13C13.5523 10 14 10.4477 14 11V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V11C2 10.4477 2.44772 10 3 10Z" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

const DeleteIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2H10M2 4H14M12 4V13C12 13.5523 11.5523 14 11 14H5C4.44772 14 4 13.5523 4 13V4H12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 7V11M10 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ApproveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 4L6 11L3 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const RejectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ActivateIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 3V13M8 3L5 6M8 3L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function MilestoneCard({ milestone, projectId, onUpdate }: MilestoneCardProps) {
  const { confirm, ConfirmComponent } = useConfirm()
  const [hasVoted, setHasVoted] = useState(false)

  const [openVoting, { isLoading: isOpeningVoting }] = useOpenVotingMutation()
  const [vote, { isLoading: isVoting }] = useVoteOnMilestoneMutation()
  const [releaseFunds, { isLoading: isReleasing }] = useReleaseFundsMutation()
  const [deleteMilestone, { isLoading: isDeleting }] = useDeleteMilestoneMutation()
  const [activateMilestone, { isLoading: isActivating }] = useActivateMilestoneMutation()

  const handleActivate = async () => {
    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        toast.error('Milestone ID not found')
        return
      }
      await activateMilestone({ projectId: String(projectId), milestoneId }).unwrap()
      onUpdate()
      toast.success('Milestone activated!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to activate milestone'
      toast.error(errorMessage)
    }
  }

  const handleOpenVoting = async () => {
    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        toast.error('Milestone ID not found')
        return
      }
      await openVoting({ milestoneId }).unwrap()
      onUpdate()
      toast.success('Voting opened!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to open voting'
      toast.error(errorMessage)
    }
  }

  const handleVote = async (decision: 'approve' | 'reject') => {
    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        toast.error('Milestone ID not found')
        return
      }
      await vote({ milestone_id: milestoneId, decision }).unwrap()
      setHasVoted(true)
      onUpdate()
      toast.success(`Vote submitted: ${decision}`)
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to submit vote'
      toast.error(errorMessage)
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
        toast.error('Milestone ID not found')
        return
      }
      await releaseFunds({ milestoneId }).unwrap()
      onUpdate()
      toast.success('Funds released successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to release funds'
      toast.error(errorMessage)
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
        toast.error('Milestone ID not found')
        return
      }
      await deleteMilestone({
        projectId: String(projectId),
        milestoneId: milestoneId
      }).unwrap()
      onUpdate()
      toast.success('Milestone deleted successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to delete milestone'
      toast.error(errorMessage)
    }
  }

  const getStatusConfig = (status: string | number) => {
    let statusLower = String(status || 'pending').toLowerCase()

    // Map backend integer status to frontend string status
    if (status === 0 || status === '0') statusLower = 'pending'
    else if (status === 1 || status === '1') statusLower = 'voting'
    else if (status === 2 || status === '2') statusLower = 'approved'
    else if (status === 3 || status === '3') statusLower = 'rejected'
    else if (status === 4 || status === '4') statusLower = 'completed'

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
  const loading = isOpeningVoting || isVoting || isReleasing || isDeleting || isActivating

  // Helper to get normalized status string for logic checks
  const getNormalizedStatus = (s: string | number) => {
    if (s === 0 || s === '0') return 'pending'
    if (s === 1 || s === '1') return 'voting'
    if (s === 2 || s === '2') return 'approved'
    if (s === 3 || s === '3') return 'rejected'
    if (s === 4 || s === '4') return 'completed'
    return String(s || '').toLowerCase()
  }

  const milestoneStatus = getNormalizedStatus(milestone.status)
  const canDelete = milestoneStatus !== 'pending' && milestoneStatus !== 'voting'
  const isActivated = milestone.is_activated

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
                Funding Progress
              </span>
              <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
                {Math.min(milestone.progress || 0, 100).toFixed(1)}%
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-warm-beige)', opacity: 0.3 }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(milestone.progress || 0, 100)}%`,
                  backgroundColor: 'var(--color-primary)'
                }}
              />
            </div>
            <div className="text-xs mt-1 text-right" style={{ color: 'var(--color-text)', opacity: 0.6 }}>
              Funded: {milestone.funded_amount} / {milestone.required_amount}
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--color-light-cream)', border: '1px solid var(--color-warm-beige)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                Required Amount
              </div>
              <div className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
                {milestone.required_amount}
              </div>
            </div>
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
            {!isActivated && milestoneStatus === 'pending' && (
              <button
                onClick={handleActivate}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#3b82f6', color: 'white' }}
                disabled={loading}
              >
                <ActivateIcon />
                <span>Activate</span>
              </button>
            )}

            {milestoneStatus === 'pending' && (
              <button
                onClick={handleOpenVoting}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                disabled={loading || ((milestone.progress || 0) < 70)}
                title={(milestone.progress || 0) < 70 ? "Funding must be > 70%" : ""}
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
