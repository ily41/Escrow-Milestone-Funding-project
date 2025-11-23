import { getProject, getProjectStats } from '@/lib/api'
import ProjectDetail from '@/components/ProjectDetail'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>
}) {
  // Handle params which might be a Promise in Next.js 15+
  const resolvedParams = await Promise.resolve(params)
  const projectId = parseInt(resolvedParams.id)
  
  let project, stats
  try {
    project = await getProject(projectId)
    stats = await getProjectStats(projectId)
  } catch (error) {
    return <div className="container mx-auto px-4 py-8">Failed to load project. Please ensure the backend is running.</div>
  }

  return <ProjectDetail project={project} stats={stats} />
}
