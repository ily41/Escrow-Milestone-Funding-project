import Link from 'next/link'
import type { Project } from '@/lib/types'
import { format } from 'date-fns'

interface ProjectCardProps {
  project: Project
  forceFlipped?: boolean
}

export default function ProjectCard({ project, forceFlipped = false }: ProjectCardProps) {
  const progress = project.progress_percentage || 0
  const totalPledged = parseFloat(project.total_pledged || project.current_funding || '0')
  const goalAmount = parseFloat(project.goal_amount || project.funding_goal || '0')
  
  // Handle both full creator object and creator_display_name/creator_name field
  const creatorName = (project as any).creator_display_name || 
                     (project as any).creator_name ||
                     project.creator?.display_name || 
                     project.creator?.name ||
                     'Unknown Creator'

  const projectId = project.project_id || (project as any).id

  return (
    <Link href={`/projects/${projectId}`}>
      {/* Mobile: Original Card Design */}
      <div className="md:hidden card hover:shadow-lg transition-shadow cursor-pointer h-full">
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>{project.title}</h3>
        <p className="mb-4 line-clamp-3" style={{ color: 'var(--text)', opacity: 0.8 }}>{project.description}</p>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: 'var(--text)', opacity: 0.7 }}>Progress</span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--border)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: 'var(--primary)' }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div>
            <span style={{ color: 'var(--text)', opacity: 0.7 }}>Raised: </span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>
              {project.currency || 'USD'} {totalPledged.toLocaleString()}
            </span>
          </div>
          <div>
            <span style={{ color: 'var(--text)', opacity: 0.7 }}>Goal: </span>
            <span className="font-semibold" style={{ color: 'var(--text)' }}>
              {project.currency || 'USD'} {goalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center text-xs" style={{ color: 'var(--text)', opacity: 0.6 }}>
            <span>By {creatorName}</span>
            <span>{format(new Date(project.deadline || project.end_date), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Desktop: Flip Card Design */}
      <div className="hidden md:block flip-card h-full">
        <div className={`flip-card-inner ${forceFlipped ? 'flipped' : ''}`}>
          {/* Front Side - Project Name and Creator */}
          <div className="flip-card-front">
            <div className="flex flex-col justify-center items-center h-full p-6">
              <h3 className="text-2xl font-bold mb-4 text-center" style={{ color: 'var(--primary)' }}>
                {project.title}
              </h3>
              <div className="mt-4">
                <p className="text-sm mb-1" style={{ color: 'var(--text)', opacity: 0.7 }}>Created by</p>
                <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  {creatorName}
                </p>
              </div>
            </div>
          </div>

          {/* Back Side - Pledge Amount and Project Name */}
          <div className="flip-card-back">
            <div className="flex flex-col justify-center items-center h-full p-6">
              <h3 className="text-xl font-bold mb-4 text-center" style={{ color: 'var(--primary-text)' }}>
                {project.title}
              </h3>
              <p className="text-sm mb-2" style={{ color: 'var(--primary-text)', opacity: 0.9 }}>Total Pledged</p>
              <p className="text-4xl font-bold mb-2" style={{ color: 'var(--primary-text)' }}>
                {project.currency || 'USD'} {totalPledged.toLocaleString()}
              </p>
              <div className="mt-4 w-full">
                <div className="flex justify-between text-sm mb-2" style={{ color: 'var(--primary-text)', opacity: 0.9 }}>
                  <span>Goal</span>
                  <span>{progress.toFixed(1)}%</span>
                </div>
                <div className="w-full rounded-full h-3" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(progress, 100)}%`, 
                      backgroundColor: 'var(--primary-text)' 
                    }}
                  />
                </div>
                <p className="text-sm mt-2 text-center" style={{ color: 'var(--primary-text)', opacity: 0.8 }}>
                  {project.currency || 'USD'} {goalAmount.toLocaleString()} goal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
