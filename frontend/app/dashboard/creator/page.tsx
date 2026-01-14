'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  useGetMyProjectsQuery,
  useCreateProjectMutation,
  useActivateProjectMutation,
  useDeactivateProjectMutation,
  useUpdateProjectMutation,
  useGetMilestonesQuery,
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

  // Notification for completed milestones
  const { data: allMilestonesData } = useGetMilestonesQuery({
    project_id: projectList.map((p: any) => p.project_id).join(',')
  }, {
    skip: projectList.length === 0
  })

  const [notified, setNotified] = useState(false)

  useEffect(() => {
    if (projectsLoading || !allMilestonesData || notified) return

    const milestones = Array.isArray(allMilestonesData) ? allMilestonesData : allMilestonesData.results || []
    if (milestones.length === 0) return

    let notifications: string[] = []

    milestones.forEach((m: any) => {
      if (m.status === 'voting' || m.status === 1) {
        const approve = m.approve_votes_count || 0
        const reject = m.reject_votes_count || 0
        if (approve > reject) {
          notifications.push(`Voting PASSED for "${m.title}". Release funds now!`)
        } else if (reject >= approve) {
          notifications.push(`Voting FAILED for "${m.title}". Refund required.`)
        }
      }
    })

    if (notifications.length > 0) {
      notifications.slice(0, 3).forEach(msg => toast.info(msg, 8000))
      setNotified(true)
    } else if (projectList.some((p: any) => p.status === 'active')) {
      if (!notified) {
        toast.info(`You have active projects. Check dashboard for actions.`, 5000)
        setNotified(true)
      }
    }
  }, [allMilestonesData, projectsLoading, notified, projectList])

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal_amount: '',
    currency: 'USD',
    start_date: '',
    end_date: '',
  })

  const [deployingProjectId, setDeployingProjectId] = useState<string | null>(null)

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const newProject = await createProject({
        title: formData.title,
        description: formData.description,
        funding_goal_eth: parseFloat(formData.goal_amount),
        deadline_timestamp: Math.floor(new Date(formData.end_date).getTime() / 1000),
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

      toast.success('Project created successfully! Initiating deployment...')

      // Automatic Deployment
      try {
        const goalEth = formData.goal_amount
        const deadline = Math.floor(new Date(formData.end_date).getTime() / 1000)

        // Default to Local Wallet for auto-deployment as requested
        const result = await deployProject(goalEth, deadline, 'local', undefined, user?.wallet_address || undefined)

        if (result.onchainProjectId === undefined) throw new Error('Failed to get on-chain project ID')

        await updateProject({
          id: newProject.project_id,
          on_chain_id: result.onchainProjectId,
          created_tx_hash: result.txHash,
          escrow_address: result.contractAddress,
        }).unwrap()

        toast.success(`Project deployed on-chain via Local Wallet!`)
      } catch (deployError: any) {
        console.error('Auto-deployment failed:', deployError)
        toast.warning(`Project created but deployment failed: ${deployError.message || 'Unknown error'}. Please deploy manually from the dashboard.`)
      }

      refetch()
    } catch (error: any) {
      const errorMessage = error?.data?.detail || error?.data?.error || error?.data?.message || error?.error || 'Failed to create project'
      toast.error(errorMessage)
    }
  }

  const handleActivate = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Activate Project',
      message: 'Are you sure you want to activate this project? It will become visible to backers.',
      confirmText: 'Activate',
      type: 'warning'
    })
    if (!isConfirmed) return
    try {
      await activateProject(id).unwrap()
      refetch()
      toast.success('Project activated!')
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to activate project')
    }
  }

  const handleDeactivate = async (id: string) => {
    const confirmed = await confirm({
      title: 'Deactivate Project',
      message: 'Deactivate this project? It will return to draft status.',
      confirmText: 'Deactivate',
      type: 'danger',
    })
    if (!confirmed) return
    try {
      await deactivateProject(id).unwrap()
      refetch()
      toast.success('Project deactivated!')
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to deactivate project')
    }
  }

  const handleDeploy = async (project: any, walletType: 'metamask' | 'local') => {
    setDeployingProjectId(project.project_id)
    try {
      const goalEth = (project.funding_goal || project.goal_amount)?.toString() || '1'
      const deadline = Math.floor(new Date(project.deadline).getTime() / 1000)
      if (isNaN(deadline)) throw new Error('Invalid project deadline')

      const result = await deployProject(goalEth, deadline, walletType, undefined, user?.wallet_address || undefined)
      if (result.onchainProjectId === undefined) throw new Error('Failed to get on-chain project ID')

      await updateProject({
        id: project.project_id,
        on_chain_id: result.onchainProjectId,
        created_tx_hash: result.txHash,
        escrow_address: result.contractAddress,
      }).unwrap()

      refetch()
      toast.success(`Project deployed on-chain via ${walletType === 'metamask' ? 'MetaMask' : 'Local Wallet'}!`)
    } catch (error: any) {
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
          <Link href="/auth/register" className="btn-primary">Register as Creator</Link>
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
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary">
            {showCreateForm ? 'Cancel' : 'Create Project'}
          </button>
        </div>

        {showCreateForm && (
          <div className="card mb-8">
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Create New Project</h2>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Title</label>
                <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Description</label>
                <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Goal Amount (ETH)</label>
                  <input type="number" step="0.01" required value={formData.goal_amount} onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Currency</label>
                  <CustomSelect value={formData.currency} onChange={(value) => setFormData({ ...formData, currency: value })} options={[{ value: 'ETH', label: 'ETH' }, { value: 'USD', label: 'USD' }]} placeholder="Select Currency" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Start Date</label>
                  <input type="datetime-local" required value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>End Date</label>
                  <input type="datetime-local" required value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="input-field" />
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
                <div key={project.project_id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/projects/${project.project_id}`}>
                        <h3 className="text-xl font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--text)' }}>{project.title}</h3>
                      </Link>
                      <p className="mt-1" style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description}</p>
                      <div className="mt-2 flex gap-4 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                        <span>Status: <span className="font-semibold capitalize">{project.status}</span></span>
                        <span>Goal: {project.currency || 'USD'} {parseFloat(project.funding_goal || project.goal_amount || '0').toLocaleString()}</span>
                        <span>Pledged: {project.currency || 'USD'} {parseFloat(project.total_pledged || project.current_funding || '0').toLocaleString()}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>On-Chain:</span>
                          {(project.on_chain_id !== undefined && project.on_chain_id !== null) ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-sm text-green-600">Deployed (ID: {project.on_chain_id})</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              <span className="text-sm text-amber-600">Not Deployed</span>
                              <button onClick={() => handleDeploy(project, 'local')} disabled={deployingProjectId === project.project_id} className="ml-2 px-3 py-1 text-xs rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors">
                                {deployingProjectId === project.project_id ? 'Deploying...' : 'Deploy Local'}
                              </button>
                              <button onClick={() => handleDeploy(project, 'metamask')} disabled={deployingProjectId === project.project_id} className="px-3 py-1 text-xs rounded-lg border border-orange-500 text-orange-600 hover:bg-orange-500/10 transition-colors">
                                {deployingProjectId === project.project_id ? 'Deploying...' : 'Deploy MetaMask'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {project.status === 'draft' && <button onClick={() => handleActivate(project.project_id)} className="btn-primary text-sm">Activate</button>}
                      {project.status === 'active' && <button onClick={() => handleDeactivate(project.project_id)} className="text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-text)' }}>Deactivate</button>}
                      <Link href={`/projects/${project.project_id}`} className="btn-secondary text-sm">View</Link>
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
