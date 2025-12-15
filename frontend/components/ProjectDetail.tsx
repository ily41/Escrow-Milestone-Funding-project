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
} from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/Toast'
import MilestoneCard from './MilestoneCard'
import PledgeForm from './PledgeForm'
import UpdateCard from './UpdateCard'
import MilestoneCreateForm from './MilestoneCreateForm'

interface ProjectDetailProps {
  project: Project
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const { user } = useAuth()
  const [showPledgeForm, setShowPledgeForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)

  // Handle both project_id (frontend type) and id (backend response)
  const projectId = project.project_id || (project as any).id

  const { data: milestonesData = [], refetch: refetchMilestones } = useGetMilestonesQuery({ project_id: projectId })
  const milestones = Array.isArray(milestonesData) ? milestonesData : (milestonesData as any).results || []

  const { data: updates = [], refetch: refetchUpdates } = useGetUpdatesQuery({ project_id: projectId })

  const [createPledge, { isLoading: isPledging }] = useCreatePledgeMutation()
  const [createUpdate, { isLoading: isCreatingUpdate }] = useCreateUpdateMutation()
  const [createMilestone, { isLoading: isCreatingMilestone }] = useCreateMilestoneMutation()

  // Check if current user is the creator
  // Since we're using wallet addresses now, we need to check against creator_address
  const isCreator = user?.is_creator === true

  const handlePledge = async (amount: number) => {
    try {
      await createPledge({ projectId, amount }).unwrap()
      setShowPledgeForm(false)
      toast.success('Pledge created successfully!')
    } catch (error: any) {
      toast.error(error.data?.error || 'Failed to create pledge')
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

      await createMilestone({
        projectId,
        title,
        description,
        target_amount: amount,
        order_index: nextOrderIndex,
        due_date: dueDate || null,
      }).unwrap()
      setShowMilestoneForm(false)
      refetchMilestones()
      toast.success('Milestone created successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || 'Failed to create milestone'
      toast.error(errorMessage)
    }
  }

  const progress = project.progress_percentage || 0
  const totalPledged = parseFloat(project.total_pledged || '0')
  const goalAmount = parseFloat(project.goal_amount || '0')

  // Calculate remaining amount for milestones
  const totalMilestoneAmount = milestones.reduce((sum: number, m: any) => sum + parseFloat(m.required_amount || '0'), 0)
  const remainingAmount = goalAmount - totalMilestoneAmount

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
                <span className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                  {project.currency} {totalPledged.toLocaleString()}
                </span>
              </div>
              <div className="w-full rounded-full h-4" style={{ backgroundColor: 'var(--border)' }}>
                <div
                  className="h-4 rounded-full transition-all"
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
                disabled={!milestones.some((m: any) => m.is_activated)}
                title={!milestones.some((m: any) => m.is_activated) ? "No active milestones" : ""}
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

          {/* Activated Milestones Container */}
          {milestones.some((m: any) => m.is_activated) && (
            <div className="card mb-6 border-2 border-blue-500/20 bg-blue-50/5">
              <h2 className="text-2xl font-semibold mb-4 text-blue-600 flex items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Activated Milestones
              </h2>
              <div className="space-y-4">
                {milestones.filter((m: any) => m.is_activated).map((milestone: any) => (
                  <MilestoneCard
                    key={milestone.milestone_id}
                    milestone={milestone}
                    projectId={projectId}
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
                {milestones.filter((m: any) => !m.is_activated).length === 0 && milestones.length > 0 ? (
                  <p style={{ color: 'var(--text)', opacity: 0.7 }}>All milestones are activated.</p>
                ) : (
                  milestones.filter((m: any) => !m.is_activated).map((milestone: any) => (
                    <MilestoneCard
                      key={milestone.milestone_id}
                      milestone={milestone}
                      projectId={projectId}
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
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Total Pledged</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {project.currency} {totalPledged.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Goal</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {project.currency} {goalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Progress</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{progress.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* On-Chain Deployment Details */}
          <div className="card">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>On-Chain Deployment</h3>
            {(project as any).onchain_project_id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-green-600 font-semibold">Deployed</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text)', opacity: 0.7 }}>On-Chain ID</span>
                  <span className="font-mono font-semibold" style={{ color: 'var(--text)' }}>
                    {(project as any).onchain_project_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text)', opacity: 0.7 }}>Wallet Type</span>
                  <span className="font-semibold capitalize" style={{ color: 'var(--text)' }}>
                    {(project as any).deployment_wallet_type === 'metamask' ? 'MetaMask' : 'Local Wallet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text)', opacity: 0.7 }}>Chain ID</span>
                  <span className="font-mono" style={{ color: 'var(--text)' }}>
                    {(project as any).chain_id || 'N/A'}
                  </span>
                </div>
                {(project as any).escrow_address && (
                  <div>
                    <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>Contract Address</span>
                    <div className="text-xs font-mono break-all mt-1" style={{ color: 'var(--text)' }}>
                      {(project as any).escrow_address}
                    </div>
                  </div>
                )}
                {(project as any).created_tx_hash && (
                  <div>
                    <span className="text-xs" style={{ color: 'var(--text)', opacity: 0.7 }}>Transaction Hash</span>
                    <div className="text-xs font-mono break-all mt-1" style={{ color: 'var(--text)' }}>
                      {(project as any).created_tx_hash}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-amber-600">Not Deployed</span>
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
