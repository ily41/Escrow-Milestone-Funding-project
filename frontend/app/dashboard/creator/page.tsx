'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useGetMyProjectsQuery,
  useCreateProjectMutation,
  useActivateProjectMutation,
  useDeactivateProjectMutation,
  useUpdateProjectMutation,
} from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/Toast'
import CustomSelect from '@/components/CustomSelect'
import { useConfirm } from '@/hooks/useConfirm'
import AuthGuard from '@/components/AuthGuard'
import { deployProject } from '@/lib/web3'

export default function CreatorDashboard() {
  const router = useRouter()
  const { confirm, ConfirmComponent } = useConfirm()
  const { user, loading: authLoading } = useAuth()

  const { data: projectsData, isLoading: projectsLoading, refetch } = useGetMyProjectsQuery(undefined, {
    skip: !user?.is_creator
  })

  // Ensure projects is always an array (handling pagination)
  const projectList = Array.isArray(projectsData)
    ? projectsData
    : Array.isArray(projectsData?.results)
      ? projectsData.results
      : []

  const [createProject, { isLoading: isCreating }] = useCreateProjectMutation()
  const [activateProject] = useActivateProjectMutation()
  const [deactivateProject] = useDeactivateProjectMutation()
  const [updateProject] = useUpdateProjectMutation()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
  })

  const [deployingProjectId, setDeployingProjectId] = useState<number | null>(null)

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProject({
        title: formData.title,
        description: formData.description,
        goal_amount: parseFloat(formData.goal_amount),
        currency: formData.currency,
        start_date: formData.start_date,
        end_date: formData.end_date,
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
      toast.success('Project created successfully!')
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to create project'
      toast.error(errorMessage)
    }
  }

  const handleActivate = async (projectId: number) => {
    const isConfirmed = await confirm({
      title: 'Activate Project',
      message: 'Are you sure you want to activate this project? It will become visible to backers.',
      confirmText: 'Activate',
      cancelText: 'Cancel',
      type: 'warning'
    })

    if (!isConfirmed) return

    try {
      await activateProject(projectId).unwrap()
      refetch()
      toast.success('Project activated!')
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.data?.message || 'Failed to activate project'
      toast.error(errorMessage)
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
      toast.success('Project deactivated!')
    } catch (error: any) {
      const errorMessage = error?.data?.error || error?.data?.message || error?.error || 'Failed to deactivate project'
      toast.error(errorMessage)
    }
  }

  const handleDeploy = async (project: any, walletType: 'metamask' | 'local') => {
    setDeployingProjectId(project.id)
    try {
      // Convert goal to ETH (assuming backend stores in USD, we use goal_amount as ETH for demo)
      const goalEth = project.goal_amount?.toString() || '1'
      // Use end_date as deadline
      const deadline = Math.floor(new Date(project.end_date).getTime() / 1000)

      console.log('Deploying project:', project.id, 'Goal:', goalEth, 'Deadline:', deadline)
      const result = await deployProject(goalEth, deadline, walletType)
      console.log('Deploy result:', result)

      if (result.onchainProjectId === undefined) {
        throw new Error('Failed to get on-chain project ID from transaction')
      }

      // Update project in backend with on-chain data
      console.log('Updating backend with:', {
        id: project.id,
        onchain_project_id: result.onchainProjectId,
        created_tx_hash: result.txHash,
        escrow_address: result.contractAddress,
        deployment_wallet_type: walletType,
        chain_id: result.chainId,
      })

      const updateResult = await updateProject({
        id: project.id,
        onchain_project_id: result.onchainProjectId,
        created_tx_hash: result.txHash,
        escrow_address: result.contractAddress,
        deployment_wallet_type: walletType,
        chain_id: result.chainId,
      }).unwrap()

      console.log('Backend update result:', updateResult)

      refetch()
      toast.success(`Project deployed on-chain via ${walletType === 'metamask' ? 'MetaMask' : 'Local Wallet'}!`)
    } catch (error: any) {
      console.error('Deployment failed:', error)
      toast.error(error.message || 'Failed to deploy project')
    } finally {
      setDeployingProjectId(null)
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
                  id="project-title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Description</label>
                <textarea
                  id="project-description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Goal Amount (ETH)</label>
                  <input
                    type="number"
                    id="project-goal"
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
                      { value: 'ETH', label: 'ETH' },
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
                    id="project-start-date"
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
                    id="project-end-date"
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
          {projectList.length === 0 ? (
            <div className="card text-center py-12">
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>You haven't created any projects yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {projectList.map((project: any) => (
                <div key={project.id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/projects/${project.id}`}>
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

                      {/* On-chain Deployment Status */}
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>On-Chain:</span>
                          {project.onchain_project_id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-sm text-green-600">Deployed (ID: {project.onchain_project_id})</span>
                              <span className="text-xs opacity-60">
                                via {project.deployment_wallet_type === 'metamask' ? 'MetaMask' : 'Local'}
                                {project.chain_id && ` (Chain: ${project.chain_id})`}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <span className="text-sm text-amber-600">Not Deployed</span>
                              <button
                                onClick={() => handleDeploy(project, 'local')}
                                disabled={deployingProjectId === project.id}
                                className="ml-2 px-3 py-1 text-xs rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
                              >
                                {deployingProjectId === project.id ? 'Deploying...' : 'Deploy Local'}
                              </button>
                              <button
                                onClick={() => handleDeploy(project, 'metamask')}
                                disabled={deployingProjectId === project.id}
                                className="px-3 py-1 text-xs rounded-lg border border-orange-500 text-orange-600 hover:bg-orange-500/10 transition-colors"
                              >
                                {deployingProjectId === project.id ? 'Deploying...' : 'Deploy MetaMask'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {project.status === 'draft' && (
                        <button
                          onClick={() => handleActivate(project.id)}
                          className="btn-primary text-sm"
                        >
                          Activate
                        </button>
                      )}
                      {project.status === 'active' && (
                        <button
                          onClick={() => handleDeactivate(project.id)}
                          className="text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90"
                          style={{
                            backgroundColor: 'var(--primary)',
                            color: 'var(--primary-text)',
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                      <Link href={`/projects/${project.id}`} className="btn-secondary text-sm">
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
