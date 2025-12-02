'use client'

import Link from 'next/link'
import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ThemeToggle from './ThemeToggle'
import HamburgerMenu from './HamburgerMenu'
import GooeyNav from './GooeyNav'

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Build navigation items dynamically based on auth state
  const navItems = useMemo(() => {
    const items = [
      { label: 'Projects', href: '/projects' }
    ];

    if (!loading) {
      if (user) {
        if (user.is_creator) {
          items.push({ label: 'Creator Dashboard', href: '/dashboard/creator' });
        }
        items.push({ label: 'Backer Dashboard', href: '/dashboard/backer' });
      } else {
        items.push({ label: 'Login', href: '/auth/login' });
        items.push({ label: 'Sign Up', href: '/auth/register' });
      }
    }

    return items;
  }, [user, loading]);

  return (
    <nav className="shadow-md bg-surface">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo - smaller on mobile */}
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-3 text-sm md:text-xl font-bold transition-all duration-300 hover:scale-105 group text-primary"
          >
            <span className="hidden sm:inline relative">
              Milestone Crowdfunding
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-current transition-all duration-300 group-hover:w-full"></span>
            </span>
            <span className="sm:hidden">MC</span>
          </Link>

          {/* Desktop Navigation with GooeyNav */}
          <div className="hidden md:flex items-center gap-6">
            {!loading && (
              <GooeyNav
                items={navItems}
                particleCount={15}
                particleDistances={[90, 10]}
                particleR={100}
                initialActiveIndex={0}
                animationTime={600}
                timeVariance={300}
                colors={[1, 2, 3, 1, 2, 3, 1, 4]}
              />
            )}

            <ThemeToggle />

            {/* User info and logout for authenticated users */}
            {!loading && user && (
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 transition-all duration-300 hover:scale-110 text-text">{user.username}</span>
                <button
                  onClick={logout}
                  className="btn-secondary text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-3">
            {/* Login and Sign Up - always visible on mobile */}
            {!loading && !user && (
              <>
                <Link
                  href="/auth/login"
                  className="relative px-2 py-1 transition-all duration-300 hover:scale-105 group text-sm text-text"
                >
                  Login
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full bg-primary"></span>
                </Link>
                <Link
                  href="/auth/register"
                  className="btn-primary text-xs px-3 py-1.5 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Hamburger Menu */}
            <HamburgerMenu
              isOpen={mobileMenuOpen}
              onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            />
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div
          className={`md:hidden border-t overflow-hidden transition-all duration-700 ease-in-out relative border-border ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}
        >
          {mobileMenuOpen && (
            <>
              <div className="py-4 space-y-3">
                <Link
                  href="/projects"
                  className="block px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md group relative text-text"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="relative z-10">Projects</span>
                  <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-primary"></span>
                </Link>

                {loading ? (
                  <div className="px-4 text-text opacity-70">Loading...</div>
                ) : user ? (
                  <>
                    {user.is_creator && (
                      <Link
                        href="/dashboard/creator"
                        className="block px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md group relative text-text"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="relative z-10">Creator Dashboard</span>
                        <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-primary"></span>
                      </Link>
                    )}
                    <Link
                      href="/dashboard/backer"
                      className="block px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-md group relative text-text"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="relative z-10">Backer Dashboard</span>
                      <span className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-primary"></span>
                    </Link>
                    <div className="px-4 py-2 transition-all duration-300 hover:scale-105 text-text">{user.username}</div>
                    <button
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      className="btn-secondary text-sm mx-4 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      Logout
                    </button>
                  </>
                ) : null}
              </div>

              {/* Theme Toggle - Absolute positioned in bottom right */}
              <div className="absolute bottom-4 right-4">
                <ThemeToggle />
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
