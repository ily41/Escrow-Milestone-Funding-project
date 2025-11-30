'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useActivateProjectMutation,
  useDeactivateProjectMutation,
} from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import CustomSelect from '@/components/CustomSelect'
import { useConfirm } from '@/hooks/useConfirm'
import AuthGuard from '@/components/AuthGuard'

export default function CreatorDashboard() {
  const router = useRouter()
  const { confirm, ConfirmComponent } = useConfirm()
  const { user, loading: authLoading } = useAuth()

  const { data: projects = [], isLoading: projectsLoading, refetch } = useGetProjectsQuery(
    { creator: user?.id },
    { skip: !user?.is_creator }
  )

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation()
  const [activateProject] = useActivateProjectMutation()
  const [deactivateProject] = useDeactivateProjectMutation()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
  })

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProject({
        ...formData,
        goal_amount: parseFloat(formData.goal_amount),
      }).unwrap()

      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        goal_amount: '',
        currency: 'USD',
        start_date: '',
        end_date: '',
      })
      refetch()
      alert('Project created successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.data?.message || error?.error || 'Failed to create project'
      alert(errorMessage)
    }
  }

  const handleActivate = async (projectId: number) => {
    const confirmed = await confirm({
      title: 'Activate Project',
      message: 'Activate this project? It will be visible to backers.',
      confirmText: 'Activate',
      cancelText: 'Cancel',
      type: 'warning',
    })
    if (!confirmed) return

    try {
      await activateProject(projectId).unwrap()
      refetch()
      alert('Project activated!')
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.data?.message || error?.error || 'Failed to activate project'
      alert(errorMessage)
    }
  }

  const handleDeactivate = async (projectId: number) => {
    const confirmed = await confirm({
      title: 'Deactivate Project',
      message: 'Deactivate this project? It will no longer be visible to backers and will return to draft status.',
      confirmText: 'Deactivate',
      cancelText: 'Cancel',
      type: 'danger',
    })
    if (!confirmed) return

    try {
      await deactivateProject(projectId).unwrap()
      refetch()
      alert('Project deactivated!')
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.data?.message || error?.error || 'Failed to deactivate project'
      alert(errorMessage)
    }
  }

  if (authLoading || projectsLoading) {
    return <div className="container mx-auto px-4 py-8" style={{ color: 'var(--text)' }}>Loading...</div>
  }

  if (!user?.is_creator) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Creator Access Required</h2>
          <p className="mb-4" style={{ color: 'var(--text)', opacity: 0.8 }}>You need to be a creator to access this dashboard.</p>
          <Link href="/auth/register" className="btn-primary">
            Register as Creator
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requiredRole="creator">
      {ConfirmComponent}
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text)' }}>Creator Dashboard</h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary"
          >
            {showCreateForm ? 'Cancel' : 'Create Project'}
          </button>
        </div>

        {showCreateForm && (
          <div className="card mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Goal Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Currency</label>
                  <CustomSelect
                    value={formData.currency}
                    onChange={(value) => setFormData({ ...formData, currency: value })}
                    options={[
                      { value: 'USD', label: 'USD' },
                      { value: 'EUR', label: 'EUR' },
                      { value: 'GBP', label: 'GBP' },
                    ]}
                    placeholder="Select Currency"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>End Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>My Projects</h2>
          {projects.length === 0 ? (
            <div className="card text-center py-12">
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>You haven't created any projects yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project: any) => (
                <div key={project.project_id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/projects/${project.project_id}`}>
                        <h3 className="text-xl font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--text)' }}>
                          {project.title}
                        </h3>
                      </Link>
                      <p className="mt-1" style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description}</p>
                      <div className="mt-2 flex gap-4 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                        <span>Status: <span className="font-semibold capitalize">{project.status}</span></span>
                        <span>Goal: {project.currency || 'USD'} {parseFloat(project.goal_amount || project.funding_goal || '0').toLocaleString()}</span>
                        <span>Pledged: {project.currency || 'USD'} {parseFloat(project.total_pledged || project.current_funding || '0').toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {project.status === 'draft' && (
                        <button
                          onClick={() => handleActivate(project.project_id)}
                          className="btn-primary text-sm"
                        >
                          Activate
                        </button>
                      )}
                      {project.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(project.project_id)}
                          className="text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-text)',
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                      <Link href={`/projects/${project.project_id}`} className="btn-secondary text-sm">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}
