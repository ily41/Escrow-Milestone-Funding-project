'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
    children: React.ReactNode
    requiredRole?: 'creator' | 'backer'
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { user, loading, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/auth/login')
        } else if (!loading && isAuthenticated && requiredRole) {
            if (requiredRole === 'creator' && !user?.is_creator) {
                router.push('/') // Or some unauthorized page
            }
            // Backer role check is implicit as all users are backers by default or can be
        }
    }, [loading, isAuthenticated, user, requiredRole, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return null // Will redirect
    }

    if (requiredRole === 'creator' && !user?.is_creator) {
        return null // Will redirect
    }

    return <>{children}</>
}
