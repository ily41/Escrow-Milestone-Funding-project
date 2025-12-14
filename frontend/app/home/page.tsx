'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useGetProjectsQuery } from '@/lib/api'
import ProjectCard from '@/components/ProjectCard'

export default function HomePage() {
  const { user, loading: authLoading } = useAuth()

  // Fetch projects with different statuses
  const { data: activeProjectsData } = useGetProjectsQuery({ status: 'active' })
  const { data: fundedProjectsData } = useGetProjectsQuery({ status: 'funded' })
  const { data: myProjectsData } = useGetProjectsQuery(
    { creator: user?.id },
    { skip: !user?.is_creator }
  )

  // Ensure all project data is arrays
  // Ensure all project data is arrays (handling pagination)
  const activeProjects = Array.isArray(activeProjectsData)
    ? activeProjectsData
    : Array.isArray(activeProjectsData?.results)
      ? activeProjectsData.results
      : []

  const fundedProjects = Array.isArray(fundedProjectsData)
    ? fundedProjectsData
    : Array.isArray(fundedProjectsData?.results)
      ? fundedProjectsData.results
      : []

  const myProjects = Array.isArray(myProjectsData)
    ? myProjectsData
    : Array.isArray(myProjectsData?.results)
      ? myProjectsData.results
      : []

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <p style={{ color: 'var(--text)' }}>Loading...</p>
      </div>
    )
  }

  const navigationCards = [
    {
      title: 'Explore Projects',
      description: 'Browse and discover innovative projects seeking funding',
      href: '/projects',
      icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      color: 'var(--primary)',
    },
    {
      title: 'Backer Dashboard',
      description: 'View your pledges, track milestones, and manage refunds',
      href: '/dashboard/backer',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      color: 'var(--success)',
    },
    ...(user?.is_creator
      ? [
        {
          title: 'Creator Dashboard',
          description: 'Manage your projects, milestones, and track funding',
          href: '/dashboard/creator',
          icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
          color: 'var(--primary)',
        },
      ]
      : []),
    {
      title: 'Create Project',
      description: 'Launch your own milestone-based crowdfunding project',
      href: user?.is_creator ? '/dashboard/creator' : '/auth/register',
      icon: 'M12 4v16m8-8H4',
      color: 'var(--secondary)',
    },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12" data-aos="fade-down">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4" style={{ color: 'var(--text)' }}>
            Welcome{user ? `, ${user.username}` : ''}!
          </h1>
          <p className="text-lg" style={{ color: 'var(--text)', opacity: 0.8 }}>
            Navigate to different sections of the platform
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {navigationCards.map((card, idx) => (
            <Link key={idx} href={card.href}>
              <div
                className="card h-full hover:shadow-lg transition-all cursor-pointer group"
                data-aos="fade-up"
                data-aos-delay={idx * 100}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{
                    backgroundColor: card.color,
                    opacity: 0.3,
                  }}
                >
                  <svg
                    className="w-9 h-9 group-hover:scale-110 transition-transform"
                    style={{ color: card.color }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  {card.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                  {card.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* My Projects Section - Only for creators */}
        {user?.is_creator && myProjects.length > 0 && (
          <section className="mb-12" data-aos="fade-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                  My Projects
                </h2>
                <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                  Manage and track your projects
                </p>
              </div>
              <Link
                href="/dashboard/creator"
                className="text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ color: 'var(--primary)' }}
              >
                Manage All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.slice(0, 3).map((project: any, idx) => (
                <div key={project.project_id} data-aos="fade-up" data-aos-delay={idx * 100}>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Projects Section */}
        <section className="mb-12" data-aos="fade-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                Active Projects
              </h2>
              <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                Currently seeking funding
              </p>
            </div>
            {activeProjects.length > 0 && (
              <Link
                href="/projects?status=active"
                className="text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ color: 'var(--primary)' }}
              >
                View All →
              </Link>
            )}
          </div>
          {activeProjects.length === 0 ? (
            <div className="card text-center py-12">
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>
                No active projects at the moment. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.slice(0, 6).map((project: any, idx) => (
                <div key={project.project_id} data-aos="fade-up" data-aos-delay={idx * 100}>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Funded Projects Section */}
        {fundedProjects.length > 0 && (
          <section className="mb-12" data-aos="fade-up">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
                  Successfully Funded
                </h2>
                <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                  Projects that reached their goals
                </p>
              </div>
              <Link
                href="/projects?status=funded"
                className="text-sm font-semibold hover:opacity-80 transition-opacity"
                style={{ color: 'var(--primary)' }}
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundedProjects.slice(0, 3).map((project: any, idx) => (
                <div key={project.project_id} data-aos="fade-up" data-aos-delay={idx * 100}>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Links Section */}
        <div className="card" data-aos="zoom-in">
          <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text)' }}>
            Quick Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/projects"
              className="p-4 rounded-lg hover:opacity-80 transition-opacity text-center"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            >
              <div className="font-semibold mb-1">All Projects</div>
              <div className="text-xs opacity-70">Browse all projects</div>
            </Link>
            <Link
              href="/projects?status=active"
              className="p-4 rounded-lg hover:opacity-80 transition-opacity text-center"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            >
              <div className="font-semibold mb-1">Active Projects</div>
              <div className="text-xs opacity-70">{activeProjects.length} active</div>
            </Link>
            <Link
              href="/projects?status=funded"
              className="p-4 rounded-lg hover:opacity-80 transition-opacity text-center"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
            >
              <div className="font-semibold mb-1">Funded Projects</div>
              <div className="text-xs opacity-70">{fundedProjects.length} funded</div>
            </Link>
            {!user && (
              <Link
                href="/auth/register"
                className="p-4 rounded-lg hover:opacity-80 transition-opacity text-center"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              >
                <div className="font-semibold mb-1">Get Started</div>
                <div className="text-xs opacity-70">Create an account</div>
              </Link>
            )}
            {user && !user.is_creator && (
              <Link
                href="/auth/register"
                className="p-4 rounded-lg hover:opacity-80 transition-opacity text-center"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              >
                <div className="font-semibold mb-1">Become Creator</div>
                <div className="text-xs opacity-70">Start creating projects</div>
              </Link>
            )}
            {user && user.is_creator && (
              <Link
                href="/dashboard/creator"
                className="p-4 rounded-lg hover:opacity-80 transition-opacity text-center"
                style={{ backgroundColor: 'var(--surface)', color: 'var(--text)' }}
              >
                <div className="font-semibold mb-1">Manage Projects</div>
                <div className="text-xs opacity-70">Go to dashboard</div>
              </Link>
            )}
          </div>
        </div>

        {/* User Info Section */}
        {user && (
          <div className="mt-8 card" data-aos="fade-up">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text)' }}>
              Account Information
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Username:</span>
                <span style={{ color: 'var(--text)' }}>{user.username}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Email:</span>
                <span style={{ color: 'var(--text)' }}>{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--text)', opacity: 0.7 }}>Role:</span>
                <span style={{ color: 'var(--text)' }}>
                  {user.is_creator ? 'Creator & Backer' : 'Backer'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
