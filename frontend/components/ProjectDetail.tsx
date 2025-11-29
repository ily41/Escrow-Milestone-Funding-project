'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Project } from '@/lib/types'
import {
  useCreatePledgeMutation,
  useGetMilestonesQuery,
  useGetUpdatesQuery,
  useCreateUpdateMutation,
} from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import MilestoneCard from './MilestoneCard'
import PledgeForm from './PledgeForm'
import UpdateCard from './UpdateCard'

interface ProjectDetailProps {
  project: Project
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
  const { user } = useAuth()
  const [showPledgeForm, setShowPledgeForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)

  const { data: milestones = [], refetch: refetchMilestones } = useGetMilestonesQuery({ project_id: project.project_id || project.id })
  const { data: updates = [], refetch: refetchUpdates } = useGetUpdatesQuery({ project_id: project.project_id || project.id })

  const [createPledge, { isLoading: isPledging }] = useCreatePledgeMutation()
  const [createUpdate, { isLoading: isCreatingUpdate }] = useCreateUpdateMutation()

  const isCreator = user?.id === (project as any)?.creator_id || user?.id === (project as any)?.creator?.id

  const handlePledge = async (amount: number) => {
    try {
      await createPledge({ projectId: project.project_id || (project as any).id, amount }).unwrap()
      setShowPledgeForm(false)
      alert('Pledge created successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.data?.message || error?.error || 'Failed to create pledge'
      alert(errorMessage)
    }
  }

  const handleCreateUpdate = async (title: string, content: string) => {
    try {
      await createUpdate({ projectId: project.project_id || (project as any).id, title, content }).unwrap()
      setShowUpdateForm(false)
      refetchUpdates()
      alert('Update created successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.data?.message || error?.error || 'Failed to create update'
      alert(errorMessage)
    }
  }

  const progress = project.progress_percentage || 0
  const totalPledged = parseFloat(project.total_pledged || project.current_funding || '0')
  const goalAmount = parseFloat(project.goal_amount || project.funding_goal || '0')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>{project.title}</h1>
        <p className="text-lg mb-4" style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description}</p>

        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
          <span>Status: <span className="font-semibold capitalize">{project.status}</span></span>
          <span>•</span>
          <span>Ends: {format(new Date(project.deadline || project.end_date), 'MMM d, yyyy')}</span>
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
                  {project.currency || 'USD'} {totalPledged.toLocaleString()}
                </span>
              </div>
              <div className="w-full rounded-full h-4" style={{ backgroundColor: 'var(--border)' }}>
                <div
                  className="h-4 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: 'var(--primary)' }}
                />
              </div>
              <div className="flex justify-between text-sm mt-2" style={{ color: 'var(--text)', opacity: 0.7 }}>
                <span>Goal: {project.currency || 'USD'} {goalAmount.toLocaleString()}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </div>

            {project.status === 'active' && (
              <button
                onClick={() => setShowPledgeForm(!showPledgeForm)}
                className="btn-primary w-full"
              >
                {showPledgeForm ? 'Cancel' : 'Make a Pledge'}
              </button>
            )}

            {showPledgeForm && (
              <div className="mt-4">
                <PledgeForm
                  onSubmit={handlePledge}
                  currency={project.currency || 'USD'}
                  loading={isPledging}
                />
              </div>
            )}
          </div>

          <div className="card mb-6">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Milestones</h2>
            {milestones.length === 0 ? (
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>No milestones defined yet.</p>
            ) : (
              <div className="space-y-4">
                {milestones.map((milestone: any) => (
                  <MilestoneCard
                    key={milestone.milestone_id || (milestone as any).id}
                    milestone={milestone}
                    projectId={project.project_id || (project as any).id}
                    onUpdate={refetchMilestones}
                  />
                ))}
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
                  <UpdateCard key={update.update_id || (update as any).id} update={update} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Total Pledged</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {project.currency || 'USD'} {totalPledged.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Goal</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {project.currency || 'USD'} {goalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Progress</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{progress.toFixed(1)}%</span>
              </div>
            </div>
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
