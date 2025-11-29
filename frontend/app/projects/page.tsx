'use client'

import { Suspense } from 'react'
import { useGetProjectsQuery } from '@/lib/api'
import ProjectCard from '@/components/ProjectCard'
import ProjectFilters from '@/components/ProjectFilters'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'

function ProjectsContent() {
  const searchParams = useSearchParams()
  const [allFlipped, setAllFlipped] = useState(false)

  const status = searchParams.get('status') || undefined
  const search = searchParams.get('search') || undefined

  const { data: projects = [], isLoading, error } = useGetProjectsQuery({ status, search })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-text">All Projects</h1>
          <button
            onClick={() => setAllFlipped(!allFlipped)}
            className="hidden md:flex px-4 py-2 rounded-lg font-semibold transition-all duration-200 hover:opacity-90 items-center gap-2 bg-primary text-primary-text"
            aria-label="Toggle card view"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${allFlipped ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{allFlipped ? 'Show Details' : 'Show Pledges'}</span>
          </button>
        </div>
        <ProjectFilters />
      </div>

      {error && (
        <div className="text-center py-12">
          <p className="text-lg text-red-500">Failed to load projects. Please try again.</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-lg text-text opacity-70">Loading...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-text opacity-70">No projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <ProjectCard key={project.project_id} project={project} forceFlipped={allFlipped} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-lg text-text opacity-70">Loading projects...</p>
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  )
}
