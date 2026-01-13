'use client'

import { useEffect, useState, useRef, useLayoutEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useGetProjectsQuery } from '@/lib/api'
import ProjectCard from '@/components/ProjectCard'
import MagicBento from '@/components/MagicBento'
import InfiniteMenu, { MenuItem } from '@/components/InfiniteMenu'
import RotatingText from '@/components/RotatingText'
import GridMotion from '@/components/GridMotion'
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
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const infiniteMenuRef = useRef<HTMLDivElement>(null)

  // Fetch active projects
  const { data: projectsData } = useGetProjectsQuery({ status: 'active' }, {
    skip: isLoggedIn === null, // Skip until auth check is done
  })

  // Ensure projects is always an array
  const projects = Array.isArray(projectsData) ? projectsData : []

  // Map projects to InfiniteMenu items
  const menuItems: MenuItem[] = projects.length > 0 ? projects.map((p: any) => ({
    image: `https://picsum.photos/seed/${p.id}/800/800?grayscale`, // Placeholder image
    link: `/projects/${p.id}`,
    title: p.title,
    description: p.short_description || 'A revolutionary project on Project Escrow.',
  })) : [
    {
      image: 'https://picsum.photos/seed/demo1/800/800?grayscale',
      link: '/projects',
      title: 'Project Alpha',
      description: 'The future of decentralized funding.',
    },
    {
      image: 'https://picsum.photos/seed/demo2/800/800?grayscale',
      link: '/projects',
      title: 'EcoBuild',
      description: 'Sustainable housing for everyone.',
    },
    {
      image: 'https://picsum.photos/seed/demo3/800/800?grayscale',
      link: '/projects',
      title: 'TechNova',
      description: 'Next-gen AI assistant.',
    },
    {
      image: 'https://picsum.photos/seed/demo4/800/800?grayscale',
      link: '/projects',
      title: 'ArtFlow',
      description: 'Empowering digital artists.',
    }
  ]

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    // Only run GSAP on client side after mount
    if (!mounted || typeof window === 'undefined') return

    // Context for cleanup
    const ctx = gsap.context(() => {
      // Parallax for Hero Text
      gsap.to('.hero-text', {
        y: -100,
        opacity: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
      })

      // Infinite Menu Growing Animation
      if (infiniteMenuRef.current) {
        ScrollTrigger.create({
          trigger: infiniteMenuRef.current,
          start: "top bottom", // Start when top of section hits bottom of viewport
          end: "top top",      // End when top of section hits top of viewport
          scrub: true,
          onUpdate: (self) => {
            // Optional: You can use self.progress for custom logic
          }
        });

        // Pinning logic
        ScrollTrigger.create({
          trigger: infiniteMenuRef.current,
          start: "top top",
          end: "+=150%", // Pin for longer to enjoy the view
          pin: true,
          scrub: true,
        });

        // Animation: Start small and grow to full screen
        gsap.fromTo(infiniteMenuRef.current,
          {
            width: "80%",
            height: "80vh",
            borderRadius: "40px",
            margin: "0 auto",
            y: 100
          },
          {
            width: "100%",
            height: "100vh",
            borderRadius: "0px",
            margin: "0",
            y: 0,
            ease: "power2.out",
            scrollTrigger: {
              trigger: infiniteMenuRef.current,
              start: "top bottom",
              end: "top top",
              scrub: 1,
            }
          }
        )
      }
    })

    return () => ctx.revert()
  }, [mounted])

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('access_token')
    if (token) {
      setIsLoggedIn(true)
      // Use replace to avoid adding to history and prevent hydration issues
      router.replace('/home')
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
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden py-20 lg:py-32 bg-bg">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col  items-center justify-center gap-12">
            <div className="flex-1 text-center lg:text-center hero-text">
              <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight text-text">
                Milestone-Based
                <div className="flex justify-center lg:justify-start">
                  <RotatingText
                    texts={['Crowdfunding', 'Security', 'Transparency', 'Community']}
                    mainClassName="text-primary block overflow-hidden mx-auto"
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1 md:pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={2000}
                  />
                </div>
              </h1>
              <p className="text-xl mb-8 max-w-2xl mx-auto lg:mx-0 text-text opacity-80">
                Support innovative projects with milestone-based funding, community governance, and secure escrow. Your funds are protected until milestones are achieved.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-center">
                <Link href="/projects" className="btn-primary text-lg px-8 py-3 inline-block text-center">
                  Explore Projects
                </Link>
                <Link href="/auth/register" className="btn-secondary text-lg px-8 py-3 inline-block text-center">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Background Elements for Parallax */}
        {/* Background Elements for Parallax */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
          <GridMotion
            items={[
              'Crowdfunding', 'Escrow', 'Security', 'Milestones',
              'Community', 'Transparency', 'Blockchain', 'Trust',
              'Innovation', 'Support', 'Growth', 'Future',
              'Decentralized', 'Smart Contracts', 'Voting', 'Governance',
              'Protection', 'Refunds', 'Backers', 'Creators',
              'Projects', 'Funding', 'Success', 'Launch',
              'Global', 'Connect', 'Build', 'Create'
            ]}
            gradientColor="#1a1a1a"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-bg/80 z-[1]"></div>
        </div>
      </section >

      {/* Infinite Menu Section  */}
      <section ref={infiniteMenuRef} className="relative h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-bg to-transparent h-32"></div>
        <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none bg-gradient-to-t from-bg to-transparent h-32"></div>

        <div className="w-full h-full">
          <InfiniteMenu items={menuItems} />
        </div>
      </section>

      {/* Features Section with MagicBento  */}
      <section className="py-20 bg-surface relative z-10">
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
      </section >

      {/* Featured Projects Section  */}
      <section className="py-20 bg-bg relative z-10">
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
              {/* {projects.slice(0, 6).map((project: any, idx: number) => (
                <div key={project.project_id} data-aos="fade-up" data-aos-delay={idx * 100}>
                  <ProjectCard project={project} />
                </div>
              ))} */}
            </div>
          )}
        </div>
      </section >

      {/* FAQ Section with Accordion  */}
      <section className="py-20 bg-border relative z-10">
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
      </section >

      {/* CTA Section  */}
      <section className="py-20 bg-primary relative z-10">
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
      </section >
    </div>
  )
}
