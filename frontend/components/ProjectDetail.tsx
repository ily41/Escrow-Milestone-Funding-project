'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import type { Project, User } from '@/lib/types'
import { createPledge, getMilestones, getUpdates, createUpdate, getCurrentUser } from '@/lib/api'
import MilestoneCard from './MilestoneCard'
import PledgeForm from './PledgeForm'
import UpdateCard from './UpdateCard'

interface ProjectDetailProps {
  project: Project
  stats: any
}

export default function ProjectDetail({ project, stats }: ProjectDetailProps) {
  const router = useRouter()
  const [milestones, setMilestones] = useState(project.milestones || [])
  const [updates, setUpdates] = useState(project.updates || [])
  const [showPledgeForm, setShowPledgeForm] = useState(false)
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isCreator, setIsCreator] = useState(false)

  useEffect(() => {
    loadMilestones()
    loadUpdates()
    loadCurrentUser()
  }, [project.id])

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)
      setIsCreator(user.id === project?.creator?.user.id)
    } catch (error) {
      // User not logged in
      setCurrentUser(null)
      setIsCreator(false)
    }
  }

  const loadMilestones = async () => {
    try {
      const data = await getMilestones(project.id)
      setMilestones(data)
    } catch (error) {
      console.error('Failed to load milestones:', error)
    }
  }

  const loadUpdates = async () => {
    try {
      const data = await getUpdates(project.id)
      setUpdates(data)
    } catch (error) {
      console.error('Failed to load updates:', error)
    }
  }

  const handlePledge = async (amount: number) => {
    setLoading(true)
    try {
      await createPledge(project.id, { amount })
      setShowPledgeForm(false)
      router.refresh()
      alert('Pledge created successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create pledge')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUpdate = async (title: string, content: string) => {
    setLoading(true)
    try {
      await createUpdate({ project: project.id, title, content })
      setShowUpdateForm(false)
      loadUpdates()
      alert('Update created successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create update')
    } finally {
      setLoading(false)
    }
  }

  const progress = project.progress_percentage || 0
  const totalPledged = parseFloat(project.total_pledged || '0')
  const goalAmount = parseFloat(project.goal_amount)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: 'var(--text)' }}>{project.title}</h1>
        <p className="text-lg mb-4" style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description}</p>
        
        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
          <span>By {project.creator?.display_name || 'Unknown Creator'}</span>
          <span>•</span>
          <span>Status: <span className="font-semibold capitalize">{project.status}</span></span>
          <span>•</span>
          <span>Ends: {format(new Date(project.end_date), 'MMM d, yyyy')}</span>
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
                  currency={project.currency}
                  loading={loading}
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
                {milestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    projectId={project.id}
                    onUpdate={loadMilestones}
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
                loading={loading}
              />
            )}

            {updates.length === 0 ? (
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>No updates yet.</p>
            ) : (
              <div className="space-y-4">
                {updates.map((update) => (
                  <UpdateCard key={update.id} update={update} />
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
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Total Pledges</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{stats.total_pledges}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Total Backers</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>{stats.total_backers}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Milestones</span>
                <span className="font-semibold" style={{ color: 'var(--text)' }}>
                  {stats.milestones.approved} approved, {stats.milestones.rejected} rejected
                </span>
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
