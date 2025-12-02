'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGetProjectsQuery } from '@/lib/api'
import ProjectCard from '@/components/ProjectCard'
import CoinModel from '@/components/CoinModel'
import MagicBento from '@/components/MagicBento'
import Carousel from '@/components/ui/Carousel'
import Accordion from '@/components/ui/Accordion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register ScrollTrigger
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export default function Home() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const coinRef = useRef<HTMLDivElement>(null)

  // Fetch active projects
  const { data: projects = [] } = useGetProjectsQuery({ status: 'active' }, {
    skip: isLoggedIn === null, // Skip until auth check is done
  })

  useLayoutEffect(() => {
    // Context for cleanup
    const ctx = gsap.context(() => {
      if (coinRef.current) {
        gsap.to(coinRef.current, {
          y: 200, // Move down 200px
          ease: 'none',
          scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: 'bottom top',
            scrub: 1, // Smooth scrubbing
          },
        })
      }
    })

    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      setIsLoggedIn(true)
      router.push('/home')
    } else {
      setIsLoggedIn(false)
    }
  }, [router])

  // Show loading state while checking auth
  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <p className="text-text">Loading...</p>
      </div>
    )
  }

  // If logged in, the redirect will happen, but show nothing while redirecting
  if (isLoggedIn) {
    return null
  }

  // Landing page for non-logged-in users
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-bg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left" data-aos="fade-right">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight text-text">
                Milestone-Based
                <span className="text-primary"> Crowdfunding</span>
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto lg:mx-0 text-text opacity-80" data-aos="fade-up" data-aos-delay="200">
                Support innovative projects with milestone-based funding, community governance, and secure escrow. Your funds are protected until milestones are achieved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start" data-aos="fade-up" data-aos-delay="400">
                <Link href="/projects" className="btn-primary text-lg px-8 py-3 inline-block text-center">
                  Explore Projects
                </Link>
                <Link href="/auth/register" className="btn-secondary text-lg px-8 py-3 inline-block text-center">
                  Get Started
                </Link>
              </div>
            </div>
            <div className="flex-1 flex justify-center" data-aos="fade-left" data-aos-delay="200">
              <div ref={coinRef} className="will-change-transform">
                <CoinModel size="large" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section with MagicBento */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold mb-4 text-text">
              Why Choose Milestone Crowdfunding?
            </h2>
            <p className="text-xl max-w-2xl mx-auto text-text opacity-80">
              A secure, transparent, and community-driven approach to crowdfunding
            </p>
          </div>

          <MagicBento
            textAutoHide={true}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={true}
            clickEffect={true}
            spotlightRadius={300}
            particleCount={12}
            glowColor="139, 0, 0"
            cards={[
              {
                color: 'var(--color-soft-gold)',
                title: 'Secure Escrow',
                description: 'Funds are held in escrow until milestones are approved by the community. Your investment is protected.',
                label: 'Protection',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )
              },
              {
                color: 'var(--color-warm-beige)',
                title: 'Community Governance',
                description: 'Backers vote on milestone completion. Transparent decision-making ensures project quality.',
                label: 'Governance',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )
              },
              {
                color: 'var(--color-soft-gold)',
                title: 'Milestone-Based',
                description: 'Projects are broken into milestones. Funds are released only when milestones are approved.',
                label: 'Milestones',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                color: 'var(--color-warm-beige)',
                title: 'Refund Protection',
                description: 'If milestones fail, you can request refunds. Your money is safe if projects don\'t deliver.',
                label: 'Safety',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                color: 'var(--color-soft-gold)',
                title: 'Transparent Tracking',
                description: 'Track project progress in real-time. See exactly where your funds are going.',
                label: 'Transparency',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )
              },
              {
                color: 'var(--color-warm-beige)',
                title: 'Smart Contracts',
                description: 'Blockchain-powered automation ensures fair and trustless execution.',
                label: 'Technology',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-deep-red)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                )
              }
            ]}
          />
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-20 bg-bg">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex justify-between items-center" data-aos="fade-up">
            <div>
              <h2 className="text-4xl font-bold mb-4 text-text">
                Active Projects
              </h2>
              <p className="text-lg text-text opacity-80">
                Discover innovative projects seeking your support
              </p>
            </div>
            <Link href="/projects" className="font-semibold hover:opacity-80 transition-opacity text-primary">
              View All →
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12" data-aos="fade-up">
              <p className="text-lg mb-4 text-text opacity-70">No active projects yet. Be the first to create one!</p>
              <Link href="/auth/register" className="btn-primary mt-4 inline-block">
                Get Started as Creator
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.slice(0, 6).map((project: any, idx: number) => (
                <div key={project.project_id} data-aos="fade-up" data-aos-delay={idx * 100}>
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section with Accordion */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-4xl font-bold mb-4 text-text">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-text opacity-80">
              Everything you need to know about milestone-based crowdfunding
            </p>
          </div>
          <div className="max-w-3xl mx-auto" data-aos="fade-up" data-aos-delay="200">
            <Accordion
              items={[
                {
                  title: 'How does milestone-based funding work?',
                  content: (
                    <p className="text-text opacity-80">
                      Projects are divided into milestones. Funds are held in escrow and released only when backers vote to approve each milestone's completion. This ensures accountability and protects your investment.
                    </p>
                  ),
                },
                {
                  title: 'What happens if a milestone is not approved?',
                  content: (
                    <p className="text-text opacity-80">
                      If backers vote against a milestone, the creator must revise and resubmit their work. If the project fails to meet its obligations, backers can request refunds for the remaining funds held in escrow.
                    </p>
                  ),
                },
                {
                  title: 'How do I vote on milestones?',
                  content: (
                    <p className="text-text opacity-80">
                      As a backer, you'll receive notifications when milestones are submitted for review. You can then review the deliverables and cast your vote (approve or reject) through your dashboard.
                    </p>
                  ),
                },
                {
                  title: 'Are my funds safe?',
                  content: (
                    <p className="text-text opacity-80">
                      Yes! All funds are held in secure escrow smart contracts. Creators can only access funds after milestone approval, and you can request refunds if milestones fail or the project doesn't deliver.
                    </p>
                  ),
                },
              ]}
              allowMultiple={false}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center" data-aos="zoom-in">
          <h2 className="text-4xl font-bold mb-4 text-primary-text">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-text opacity-90">
            Join our community of creators and backers. Launch your project or support innovation today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register" className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-block bg-primary-text text-primary">
              Create Account
            </Link>
            <Link href="/projects" className="px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity inline-block border-2 border-primary-text text-primary-text">
              Browse Projects
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
