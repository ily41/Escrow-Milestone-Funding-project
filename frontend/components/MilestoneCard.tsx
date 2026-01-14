'use client'

import { useState } from 'react'
import type { Milestone } from '@/lib/types'
import { format } from 'date-fns'
import {
  useOpenVotingMutation,
  useVoteOnMilestoneMutation,
  useReleaseFundsMutation,
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useDeleteMilestoneMutation,
  useActivateMilestoneMutation,
  usePledgeMilestoneMutation,
  useRefundMilestoneMutation,
} from '@/lib/api'
import { pledgeToProject, activateMilestone as activateMilestoneOnChain, releaseFunds as releaseFundsOnChain, voteOnMilestone } from '@/lib/web3'
import { useConfirm } from '@/hooks/useConfirm'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/Toast'

interface MilestoneCardProps {
  milestone: Milestone
  projectId: string | number
  project?: any  // Add project data for on-chain operations
  fundedAmount?: number
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

export default function MilestoneCard({ milestone, projectId, project, fundedAmount, onUpdate }: MilestoneCardProps) {
  const { confirm, ConfirmComponent } = useConfirm()
  const { user } = useAuth()
  const isCreator = user?.is_creator === true
  const isBacker = user?.is_backer === true
  const [hasVoted, setHasVoted] = useState(false)

  const [openVoting, { isLoading: isOpeningVoting }] = useOpenVotingMutation()
  const [vote, { isLoading: isVoting }] = useVoteOnMilestoneMutation()
  const [releaseFunds, { isLoading: isReleasing }] = useReleaseFundsMutation()
  const [deleteMilestone, { isLoading: isDeleting }] = useDeleteMilestoneMutation()
  const [activateMilestone, { isLoading: isActivating }] = useActivateMilestoneMutation()
  const [updateMilestone] = useUpdateMilestoneMutation()
  const [pledgeMilestone, { isLoading: isPledging }] = usePledgeMilestoneMutation()
  const [refundMilestone, { isLoading: isRefunding }] = useRefundMilestoneMutation()

  const handlePledge = async () => {
    const amount = window.prompt('Enter amount to pledge (ETH):')
    if (!amount || isNaN(Number(amount))) return

    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        toast.error('Milestone ID not found')
        return
      }

      // Check if user has a linked wallet
      if (!user?.wallet_type) {
        toast.error('Please link a wallet in your profile first')
        return
      }

      // 1. Get contract details from backend
      console.log('[DEBUG] Pledging for milestone:', {
        milestoneId,
        onChainProjectId: project?.on_chain_id,
        onChainMilestoneId: (milestone as any).on_chain_id,
        escrow: project?.escrow_address
      })
      await pledgeMilestone({
        projectId: String(projectId),
        milestoneId,
        amount: Number(amount)
      }).unwrap()

      // 2. Execute on-chain transaction using user's linked wallet type
      await pledgeToProject(
        project?.escrow_address || '',
        project?.on_chain_id,
        String(amount),
        user.wallet_type as 'metamask' | 'local',
        user.wallet_address || undefined
      )

      toast.success('Pledge confirmed on blockchain!')

      // 3. Refresh milestone and project data to show updated progress
      setTimeout(() => {
        onUpdate()
      }, 2000) // Wait 2 seconds for indexer to process
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.message || 'Pledge failed'
      toast.error(errorMessage)
      console.error(error)
    }
  }

  const handleActivate = async () => {
    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        toast.error('Milestone ID not found')
        return
      }

      // Check if milestone has on_chain_id
      const onchainMilestoneId = (milestone as any).on_chain_id

      if (onchainMilestoneId === undefined || onchainMilestoneId === null) {
        toast.error('Milestone not created on blockchain. Please submit it to blockchain first.')
        return
      }

      // Check if user has a linked wallet
      if (!user?.wallet_type) {
        toast.error('Please link a wallet in your profile first')
        return
      }

      // Check if project is deployed on-chain
      const projectOnChainId = project?.on_chain_id
      if (projectOnChainId === undefined || projectOnChainId === null) {
        toast.error('Project not deployed on blockchain')
        return
      }

      // 1. Activate in backend first
      await activateMilestone({ projectId: String(projectId), milestoneId }).unwrap()

      // 2. Activate on blockchain
      toast.pending('Activating milestone on blockchain...')
      await activateMilestoneOnChain(
        projectOnChainId,
        onchainMilestoneId,
        user.wallet_type as 'metamask' | 'local',
        project?.escrow_address,
        user.wallet_address || undefined
      )

      onUpdate()
      toast.success('Milestone activated on blockchain!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || error?.message || 'Failed to activate milestone'
      toast.error(errorMessage)
    }
  }

  const handleOpenVoting = async () => {
    const confirmed = await confirm({
      title: 'Open Voting',
      message: 'Are you sure you want to open voting? This will allow backers to vote.',
      confirmText: 'Open Voting',
      cancelText: 'Cancel',
      type: 'info',
    })
    if (!confirmed) return

    try {
      const mId = (milestone as any).id || milestone.milestone_id
      if (!mId) {
        toast.error('Milestone ID not found')
        return
      }
      await openVoting({ milestoneId: mId }).unwrap()
      onUpdate()
      // toast.success('Voting opened!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to open voting'
      toast.error(errorMessage)
    }
  }

  const handleVote = async (decision: 'approve' | 'reject') => {
    try {
      const mId = (milestone as any).id || milestone.milestone_id
      if (!mId) {
        toast.error('Milestone ID not found')
        return
      }

      const projectOnChainId = project?.on_chain_id
      const onchainMilestoneId = (milestone as any).on_chain_id

      if (projectOnChainId === undefined || onchainMilestoneId === undefined) {
        toast.error('Milestone details missing for on-chain operation')
        return
      }

      if (!user?.wallet_type) {
        toast.error('Please link a wallet first')
        return
      }

      console.log('[DEBUG] Casting vote:', {
        projectId,
        milestoneId: mId,
        onChainProjectId: projectOnChainId,
        onChainMilestoneId: onchainMilestoneId,
        decision
      })

      // 1. On-chain vote (Execute first)
      toast.pending(`Submitting ${decision} vote to blockchain...`)
      await voteOnMilestone(
        projectOnChainId,
        onchainMilestoneId,
        decision === 'approve',
        user.wallet_type as 'metamask' | 'local',
        project?.escrow_address,
        user.wallet_address || undefined
      )

      // 2. Backend record
      const voteResult = await vote({ milestone_id: mId, decision }).unwrap()

      setHasVoted(true)
      onUpdate()

      if ((voteResult as any).can_finalize === false && (voteResult as any).is_synced === false) {
        toast.success(`Vote submitted! Waiting for blockchain sync to finalize milestone...`)
        // Poll for status update
        let attempts = 0
        const pollInterval = setInterval(async () => {
          attempts++
          // Call backend again to check if sync caught up
          const pollRes = await vote({ milestone_id: mId, decision }).unwrap()
          if ((pollRes as any).can_finalize === true) {
            clearInterval(pollInterval)
            onUpdate()
            toast.success('Milestone voting finalized!')
          }
          if (attempts >= 10) clearInterval(pollInterval)
        }, 3000)
      } else {
        toast.success(`Vote submitted: ${decision}`)
      }
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || error?.message || 'Failed to submit vote'
      toast.error(errorMessage)
    }
  }



  const handleRelease = async () => {
    const confirmed = await confirm({
      title: 'Release Funds',
      message: 'Release funds for this milestone? This will move funds to your wallet and the platform treasury.',
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

      const projectOnChainId = project?.on_chain_id
      const onchainMilestoneId = (milestone as any).on_chain_id

      if (projectOnChainId === undefined || onchainMilestoneId === undefined) {
        toast.error('Milestone details missing for on-chain operation')
        return
      }

      if (!user?.wallet_type) {
        toast.error('Please link a wallet first')
        return
      }

      // 1. Notify backend
      await releaseFunds({ milestoneId }).unwrap()

      // 2. Execute on-chain
      toast.pending('Releasing funds on blockchain...')
      await releaseFundsOnChain(
        projectOnChainId,
        onchainMilestoneId,
        user.wallet_type as 'metamask' | 'local',
        project?.escrow_address,
        user.wallet_address || undefined
      )

      onUpdate()
      toast.success('Funds released successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || error?.message || 'Failed to release funds'
      toast.error(errorMessage)
    }
  }


  const handleRefund = async () => {
    const confirmed = await confirm({
      title: 'Refund Milestone',
      message: 'Voting failed. Refund this milestone to the project pool?',
      confirmText: 'Refund',
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
      await refundMilestone({ milestoneId }).unwrap()
      onUpdate()
      toast.success('Milestone refunded to project pool!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to refund milestone'
      toast.error(errorMessage)
    }
  }

  const handleBlockchainSubmit = async () => {
    try {
      const milestoneId = (milestone as any).id || milestone.milestone_id
      if (!milestoneId) {
        toast.error('Milestone ID not found')
        return
      }

      if (!user?.wallet_type) {
        toast.error('Please link a wallet in your profile first')
        return
      }

      const projectOnChainId = project?.on_chain_id
      if (projectOnChainId === undefined || projectOnChainId === null) {
        toast.error('Project not deployed on blockchain')
        return
      }

      toast.pending('Submitting milestone to blockchain...')
      const { submitMilestone } = await import('@/lib/web3')
      const result = await submitMilestone(
        projectOnChainId,
        milestone.title,
        milestone.required_amount.toString(),
        user.wallet_type as 'metamask' | 'local',
        project?.escrow_address,
        user.wallet_address || undefined
      )

      if (result.onchainMilestoneId === undefined) {
        throw new Error('Failed to extract milestone ID')
      }

      await updateMilestone({
        projectId: String(projectId),
        milestoneId,
        on_chain_id: result.onchainMilestoneId,
      }).unwrap()

      toast.success('Milestone submitted to blockchain!')
    } catch (error: any) {
      toast.error(error.message || 'Submission failed')
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
    else if (status === 1 || status === '1') statusLower = 'active'
    else if (status === 2 || status === '2') statusLower = 'voting'
    else if (status === 3 || status === '3') statusLower = 'completed'
    else if (status === 4 || status === '4') statusLower = 'rejected'
    else if (status === 5 || status === '5') statusLower = 'approved'

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
      case 'approved':
        return {
          bg: '#3b82f6',
          text: 'white',
          Icon: ApproveIcon,
          label: 'Approved'
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
  const loading = isOpeningVoting || isVoting || isReleasing || isDeleting || isActivating || isPledging

  // Helper to get normalized status string for logic checks
  const getNormalizedStatus = (s: string | number): "pending" | "active" | "voting" | "completed" | "rejected" | string => {
    if (s === 0 || s === '0') return 'pending'
    if (s === 1 || s === '1') return 'active'
    if (s === 2 || s === '2') return 'voting'
    if (s === 3 || s === '3') return 'completed'
    if (s === 4 || s === '4') return 'rejected'
    if (s === 5 || s === '5') return 'approved'
    return String(s || '').toLowerCase()
  }

  const milestoneStatus = getNormalizedStatus(milestone.status)
  const canDelete = (milestoneStatus as string) === 'pending'
  const isActivated = milestone.is_activated === true

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

          {fundedAmount !== undefined && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: 'var(--color-text)' }}>Funding Progress</span>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                  {((fundedAmount / parseFloat(milestone.required_amount || '1')) * 100).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-warm-beige)', opacity: 0.3 }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((fundedAmount / parseFloat(milestone.required_amount || '1')) * 100, 100)}%`,
                    backgroundColor: 'var(--color-primary)'
                  }}
                />
              </div>
              <div className="text-xs mt-1 text-right" style={{ color: 'var(--color-text)', opacity: 0.7 }}>
                {fundedAmount.toLocaleString()} / {parseFloat(milestone.required_amount || '0').toLocaleString()}
              </div>
            </div>
          )}



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
          <div className="flex gap-2 w-full">
            {/* Submit button only if not on chain */}
            {!milestone.on_chain_id && isCreator && (
              <button
                onClick={handleBlockchainSubmit}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#10b981', color: 'white' }}
                disabled={loading || !(project.on_chain_id || (project as any).onchain_project_id)}
                title={!(project.on_chain_id || (project as any).onchain_project_id) ? "Deploy project first" : ""}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Submit to Blockchain</span>
              </button>
            )}

            {/* Activate button if on chain but not activated */}
            {milestone.on_chain_id && !isActivated && isCreator && milestoneStatus === 'pending' && (
              <button
                onClick={handleActivate}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
                disabled={loading}
              >
                <ActivateIcon />
                <span>Activate Milestone</span>
              </button>
            )}

            {/* Pledge button if on chain but not yet voting */}
            {isActivated && (milestoneStatus === 'active' || milestoneStatus === 'pending') && (
              <button
                onClick={handlePledge}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#8b5cf6', color: 'white' }}
                disabled={loading}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1V15M1 8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 5L8 1L4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Pledge</span>
              </button>
            )}

            {/* Open Voting button for creator */}
            {isActivated && milestoneStatus === 'active' && isCreator && (
              <button
                onClick={handleOpenVoting}
                className="flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
                disabled={loading}
              >
                <OpenVotingIcon />
                <span>Open Voting</span>
              </button>
            )}

            {/* Voting starts automatically message for backers */}
            {isActivated && milestoneStatus === 'active' && !isCreator && (
              <div className="w-full text-xs text-text border border-border/20 rounded p-2 bg-text/5 italic text-center">
                Voting starts automatically once milestone goal is reached.
              </div>
            )}

            {milestoneStatus === 'voting' && (
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => handleVote('approve')}
                  disabled={isVoting}
                  className="btn-primary flex-1 py-1.5 text-sm"
                >
                  {isVoting ? 'Voting...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleVote('reject')}
                  disabled={isVoting}
                  className="btn-secondary flex-1 py-1.5 text-sm"
                >
                  {isVoting ? 'Voting...' : 'Reject'}
                </button>
              </div>
            )}

            {milestoneStatus === 'approved' && isCreator && (
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
