'use client'

import { useGetProjectQuery } from '@/lib/api'
import ProjectDetail from '@/components/ProjectDetail'
import { use } from 'react'

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const projectId = resolvedParams.id // UUID is a string, not a number

  const { data: project, isLoading, error } = useGetProjectQuery(projectId)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-text">Loading project...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Failed to load project. Please try again.</p>
      </div>
    )
  }

  return <ProjectDetail project={project} />
}
