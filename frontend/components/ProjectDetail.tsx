'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Project } from '@/lib/types'
import {
  useCreatePledgeMutation,
  useGetMilestonesQuery,
  useGetUpdatesQuery,
  useCreateUpdateMutation,
  useCreateMilestoneMutation,
  useUpdateMilestoneMutation,
  useUpdateProjectMutation,
  useCreateProjectMutation,
} from '@/lib/api'
import { deployProject, submitMilestone } from '@/lib/web3'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/Toast'
import MilestoneCard from './MilestoneCard'
import PledgeForm from './PledgeForm'
import UpdateCard from './UpdateCard'
import MilestoneCreateForm from './MilestoneCreateForm'

interface ProjectDetailProps {
  project: Project
  refetch?: () => void
}


export default function ProjectDetail({ project, refetch }: ProjectDetailProps) {

  const { user } = useAuth()
  const [showPledgeForm, setShowPledgeForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [optimisticTotalPledged, setOptimisticTotalPledged] = useState<number | null>(null)


  // Handle both project_id (frontend type) and id (backend response)
  const projectId = project.project_id || (project as any).id

  const { data: milestonesData = [], refetch: refetchMilestones } = useGetMilestonesQuery({ project_id: projectId })
  const milestones = Array.isArray(milestonesData) ? milestonesData : (milestonesData as any).results || []

  const { data: updates = [], refetch: refetchUpdates } = useGetUpdatesQuery({ project_id: projectId })

  const [createPledge, { isLoading: isPledging }] = useCreatePledgeMutation()
  const [createUpdate, { isLoading: isCreatingUpdate }] = useCreateUpdateMutation()
  const [createMilestone, { isLoading: isCreatingMilestone }] = useCreateMilestoneMutation()
  const [updateMilestone] = useUpdateMilestoneMutation()
  const [createProject, { isLoading: isCreatingProject }] = useCreateProjectMutation()
  const [updateProjectMutation, { isLoading: isUpdatingProject }] = useUpdateProjectMutation()

  // Check if current user is the creator
  // Since we're using wallet addresses now, we need to check against creator_address
  const isCreator = user?.is_creator === true
  const isBacker = user?.is_backer === true

  const getNormalizedStatus = (s: string | number) => {
    if (s === 0 || s === '0') return 'pending'
    if (s === 1 || s === '1') return 'active'
    if (s === 2 || s === '2') return 'voting'
    if (s === 3 || s === '3') return 'completed'
    if (s === 4 || s === '4') return 'rejected'
    return String(s || '').toLowerCase()
  }

  const handlePledge = async (amount: number) => {
    try {
      if (!user?.wallet_type) {
        toast.error('Please link a wallet in your profile first')
        return
      }

      const projectOnChainId = project.on_chain_id ?? (project as any).onchain_project_id
      console.log('[DEBUG] Pledging for project:', {
        backendId: projectId,
        onChainId: projectOnChainId,
        escrow: project.escrow_address
      })
      if (projectOnChainId === undefined || projectOnChainId === null) {
        toast.error('Project not deployed on blockchain')
        return
      }

      // 1. Execute on-chain transaction first to get the hash
      const { pledgeToProject } = await import('@/lib/web3')
      toast.pending('Submitting pledge to blockchain...')
      const receipt = await pledgeToProject(
        project.escrow_address!,
        projectOnChainId,
        amount.toString(),
        user.wallet_type as 'metamask' | 'local',
        user.wallet_address || undefined
      )

      // 2. Create pledge in backend with the REAL transaction hash
      // Mark it as pending so it shows up immediately even after refresh
      await createPledge({
        projectId,
        amount,
        transaction_hash: receipt.hash
      }).unwrap()

      setShowPledgeForm(false)
      // Set optimistic state immediately
      const currentTotal = parseFloat(project.total_pledged || '0')
      setOptimisticTotalPledged(currentTotal + amount)

      toast.success('Pledge confirmed on blockchain! Syncing progress...')


      // Poll every 2 seconds for 30 seconds
      let attempts = 0
      const pollInterval = setInterval(async () => {
        attempts++
        if (refetch) {
          const result = await refetch()
          // If the real total_pledged has been updated by the indexer, clear optimistic state
          const newTotal = parseFloat((result as any).data?.total_pledged || '0')
          if (newTotal >= currentTotal + (amount * 0.99)) {
            setOptimisticTotalPledged(null)
            clearInterval(pollInterval)
          }
        }
        refetchMilestones()
        if (attempts >= 15) {
          clearInterval(pollInterval)
          setOptimisticTotalPledged(null) // Revert optimistic after timeout just in case
        }
      }, 2000)

    } catch (error: any) {
      toast.error(error.data?.error || error.message || 'Failed to create pledge')
    }
  }


  const handleDeployProject = async () => {
    try {
      if (!user?.wallet_type) {
        toast.error('Please link a wallet in your profile first')
        return
      }

      const goalEth = (project.funding_goal || (project as any).goal_amount)?.toString() || '1'
      const deadline = Math.floor(new Date(project.deadline).getTime() / 1000)
      if (isNaN(deadline)) throw new Error('Invalid project deadline')

      toast.pending('Deploying project to blockchain...')
      const result = await deployProject(goalEth, deadline, user.wallet_type as 'metamask' | 'local', undefined, user.wallet_address || undefined)

      if (result.onchainProjectId === undefined) throw new Error('Failed to get on-chain project ID')

      await updateProjectMutation({
        id: projectId,
        on_chain_id: result.onchainProjectId,
        created_tx_hash: result.txHash,
        escrow_address: result.contractAddress,
      }).unwrap()

      toast.success('Project deployed on-chain!')
      refetchMilestones()
    } catch (error: any) {
      toast.error(error.message || 'Failed to deploy project')
    }
  }

  const handleCreateUpdate = async (title: string, content: string) => {
    try {
      await createUpdate({ projectId, title, content }).unwrap()
      setShowUpdateForm(false)
      refetchUpdates()
      toast.success('Update created successfully!')
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create update')
    }
  }

  const handleCreateMilestone = async (title: string, description: string, amount: number, dueDate: string) => {
    try {
      // Calculate order index based on current milestones count
      const nextOrderIndex = milestones.length + 1

      // 1. Create milestone in backend
      const milestone = await createMilestone({
        projectId,
        title,
        description,
        target_amount: amount,
        order_index: nextOrderIndex,
        due_date: dueDate || null,
      }).unwrap()

      // 2. Check if project is deployed on-chain
      const projectOnChainId = project.on_chain_id ?? (project as any).onchain_project_id
      if (projectOnChainId === undefined || projectOnChainId === null) {
        toast.warning('Milestone created in backend only. Deploy project on-chain first to enable pledging.')
        setShowMilestoneForm(false)
        refetchMilestones()
        return
      }

      // 3. Check if user has a linked wallet
      if (!user?.wallet_type) {
        toast.warning('Milestone created in backend. Link a wallet to submit it on-chain.')
        setShowMilestoneForm(false)
        refetchMilestones()
        return
      }

      // 4. Submit milestone on blockchain
      toast.pending('Submitting milestone to blockchain...')
      const result = await submitMilestone(
        projectOnChainId,
        title,
        amount.toString(),
        user.wallet_type as 'metamask' | 'local',
        (project as any).escrow_address,
        user.wallet_address || undefined
      )

      // 5. Update backend with on_chain_id
      if (result.onchainMilestoneId === undefined) {
        throw new Error('Failed to extract milestone ID from blockchain transaction')
      }

      // If backend didn't return an ID, refetch to find it
      let mId = (milestone as any).id || (milestone as any).milestone_id
      if (!mId) {
        console.warn('Could not find milestone ID to update on-chain ID');
      } else {
        await updateMilestone({
          projectId,
          milestoneId: mId,
          on_chain_id: result.onchainMilestoneId,
        }).unwrap()
      }

      setShowMilestoneForm(false)
      toast.success('Milestone created on blockchain!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.message || 'Failed to create milestone'
      toast.error(errorMessage)
    }
  }

  const progress_pct = project.progress_percentage || 0
  const realTotalPledged = parseFloat(project.total_pledged || '0')
  const totalPledged = optimisticTotalPledged !== null ? optimisticTotalPledged : realTotalPledged
  const goalAmount = parseFloat(project.goal_amount || '0')

  // Calculate percentage based on possibly optimistic total
  const progress = goalAmount > 0 ? (totalPledged / goalAmount) * 100 : 0

  // Calculate remaining amount for milestones

  const totalMilestoneAmount = milestones.reduce((sum: number, m: any) => sum + parseFloat(m.target_amount || '0'), 0)
  const remainingAmount = goalAmount - totalMilestoneAmount

  // Calculate sequential funding progress
  let remainingPledge = totalPledged
  const milestonesWithFunding = milestones.map((m: any) => {
    const target = parseFloat(m.required_amount || '0')
    const funded = Math.min(remainingPledge, target)
    remainingPledge = Math.max(0, remainingPledge - funded)
    return { ...m, funded_amount: funded }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>{project.title}</h1>
        <p className="text-lg mb-4" style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description}</p>

        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
          <span>Status: <span className="font-semibold capitalize">{project.status}</span></span>
          {(project.deadline) && (
            <>
              <span>•</span>
              <span>Ends: {(() => {
                const dateStr = project.deadline
                if (!dateStr) return 'N/A'
                const date = new Date(dateStr)
                if (isNaN(date.getTime())) return 'N/A'
                return format(date, 'MMM d, yyyy')
              })()}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Funding Progress</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Raised</span>
                <div className="flex items-center gap-2">
                  {project.is_syncing && (
                    <span className="text-xs font-medium animate-pulse text-primary flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Syncing...
                    </span>
                  )}
                  <span className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                    {project.currency} {totalPledged.toLocaleString()}
                  </span>
                </div>

              </div>
              <div className="w-full rounded-full h-4 relative overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                {project.is_syncing && (
                  <div className="absolute inset-0 bg-primary/10 animate-sync-slide" />
                )}
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ${project.is_syncing ? 'animate-pulse opacity-80' : ''}`}
                  style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: 'var(--primary)' }}
                />
              </div>

              <div className="flex justify-between text-sm mt-2" style={{ color: 'var(--text)', opacity: 0.7 }}>
                <span>Goal: {project.currency} {goalAmount.toLocaleString()}</span>
                <span>{Math.min(progress, 100).toFixed(1)}%</span>
              </div>
            </div>

            {project.status === 'active' && (
              <button
                onClick={() => setShowPledgeForm(!showPledgeForm)}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!(project.on_chain_id || (project as any).onchain_project_id)}
                title={!(project.on_chain_id || (project as any).onchain_project_id) ? "Project not deployed on-chain" : ""}
              >
                {showPledgeForm ? 'Cancel' : 'Make a Pledge'}
              </button>
            )}

            {showPledgeForm && (
              <div className="mt-4">
                <PledgeForm
                  onSubmit={handlePledge}
                  currency={project.currency || 'ETH'}
                  loading={isPledging}
                />
              </div>
            )}
          </div>

          {/* Completed Milestones Section */}
          {milestones.some((m: any) => getNormalizedStatus(m.status) === 'completed') && (
            <div className="card mb-6 border-2 border-green-500/20 bg-green-50/5 animate-fade-in">
              <h2 className="text-2xl font-semibold mb-4 text-green-600 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7.75 12L10.58 14.83L16.25 9.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Completed Milestones
              </h2>
              <div className="space-y-4">
                {milestonesWithFunding.filter((m: any) => getNormalizedStatus(m.status) === 'completed').map((milestone: any) => (
                  <MilestoneCard
                    key={milestone.milestone_id}
                    milestone={milestone}
                    projectId={projectId}
                    project={project}
                    fundedAmount={milestone.funded_amount}
                    onUpdate={refetchMilestones}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Activated Milestones Container */}
          {milestones.some((m: any) => m.is_activated && getNormalizedStatus(m.status) !== 'completed') && (
            <div className="card mb-6 border-2 border-blue-500/20 bg-blue-50/5">
              <h2 className="text-2xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Activated Milestones
              </h2>
              <div className="space-y-4">
                {milestonesWithFunding.filter((m: any) => m.is_activated && getNormalizedStatus(m.status) !== 'completed').map((milestone: any) => (
                  <MilestoneCard
                    key={milestone.milestone_id}
                    milestone={milestone}
                    projectId={projectId}
                    project={project}
                    fundedAmount={milestone.funded_amount}
                    onUpdate={refetchMilestones}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Milestones</h2>
              {isCreator && (
                <button
                  onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                  className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={remainingAmount <= 0 && !showMilestoneForm}
                  title={remainingAmount <= 0 ? "Project fully allocated" : ""}
                >
                  {showMilestoneForm ? 'Cancel' : 'Add Milestone'}
                </button>
              )}
            </div>

            {showMilestoneForm && isCreator && (
              <MilestoneCreateForm
                onSubmit={handleCreateMilestone}
                loading={isCreatingMilestone}
                remainingAmount={remainingAmount}
                currency={project.currency || 'ETH'}
              />
            )}

            {milestones.length === 0 ? (
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>No milestones defined yet.</p>
            ) : (
              <div className="space-y-4">
                {milestonesWithFunding.filter((m: any) => !m.is_activated).length === 0 && milestones.length > 0 ? (
                  <p style={{ color: 'var(--text)', opacity: 0.7 }}>All milestones are activated.</p>
                ) : (
                  milestonesWithFunding.filter((m: any) => !m.is_activated).map((milestone: any) => (
                    <MilestoneCard
                      key={milestone.milestone_id}
                      milestone={milestone}
                      projectId={projectId}
                      project={project}
                      fundedAmount={milestone.funded_amount}
                      onUpdate={refetchMilestones}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Project Updates</h2>
              {isCreator && (
                <button
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  className="btn-secondary text-sm"
                >
                  {showUpdateForm ? 'Cancel' : 'Post Update'}
                </button>
              )}
            </div>

            {showUpdateForm && (
              <UpdateForm
                onSubmit={handleCreateUpdate}
                loading={isCreatingUpdate}
              />
            )}

            {updates.length === 0 ? (
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>No updates yet.</p>
            ) : (
              <div className="space-y-4">
                {updates.map((update: any) => (
                  <UpdateCard key={update.update_id} update={update} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card mb-6">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Total Pledged</span>
                <span className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                  {project.currency} {totalPledged.toLocaleString()}
                </span>
              </div>
              <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border)' }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: 'var(--primary)' }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>{progress.toFixed(1)}% funded</span>
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Goal: {project.currency} {goalAmount.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    {(project as any).backers_count || 0}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>Backers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                    {(project as any).days_remaining || 0}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>Days Left</div>
                </div>
              </div>
            </div>
          </div>

          {/* On-Chain Deployment Details */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>On-Chain Deployment</h3>
            {project.on_chain_id || (project as any).onchain_project_id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-green-600 font-semibold">Deployed</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text)', opacity: 0.7 }}>On-Chain ID</span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
                    {project.on_chain_id || (project as any).onchain_project_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text)', opacity: 0.7 }}>Address</span>
                  <span className="font-mono text-xs truncate max-w-[120px]" style={{ color: 'var(--text)' }}>
                    {project.escrow_address}
                  </span>
                </div>
              </div>
            ) : isCreator ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-amber-600">Not Deployed</span>
                </div>
                <button
                  onClick={handleDeployProject}
                  disabled={isUpdatingProject}
                  className="btn-primary-outline w-full text-xs py-2 flex items-center justify-center gap-2"
                >
                  {isUpdatingProject ? (
                    'Deploying...'
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2V14M2 8H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Submit Project to Blockchain
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 opacity-60">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-slate-500 italic">Project initialization in progress</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function UpdateForm({ onSubmit, loading }: { onSubmit: (title: string, content: string) => void; loading: boolean }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && content) {
      onSubmit(title, content)
      setTitle('')
      setContent('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
      <input
        type="text"
        placeholder="Update title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="input-field mb-2"
        required
      />
      <textarea
        placeholder="Update content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="input-field mb-2"
        rows={4}
        required
      />
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Posting...' : 'Post Update'}
      </button>
    </form>
  )
}
