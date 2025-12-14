import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGetCurrentUserQuery, api } from '@/lib/api'
import { store } from '@/lib/store'
import type { User } from '@/lib/types'

export function useAuth() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    // Check if user is logged in (has token)
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('access_token')

    // Only fetch user data if token exists
    const { data, error, isLoading } = useGetCurrentUserQuery(undefined, {
        skip: !hasToken, // Skip query if no token
    })

    useEffect(() => {
        if (!hasToken) {
            setUser(null)
            setLoading(false)
            return
        }

        if (data) {
            setUser(data as User)
            setLoading(false)
        } else if (error) {
            // Token might be invalid, clear it
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setUser(null)
            setLoading(false)
        } else if (!isLoading) {
            setLoading(false)
        }
    }, [data, error, isLoading, hasToken])

    // Listen for login/logout events
    useEffect(() => {
        const handleLogin = () => {
            setLoading(true)
            // RTK Query will automatically refetch
        }

        const handleLogout = () => {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            setUser(null)
            // Reset API state to clear cache
            store.dispatch(api.util.resetApiState())
            router.push('/auth/login')
        }

        window.addEventListener('userLogin', handleLogin)
        window.addEventListener('userLogout', handleLogout)

        return () => {
            window.removeEventListener('userLogin', handleLogin)
            window.removeEventListener('userLogout', handleLogout)
        }
    }, [router])

    const logout = () => {
        window.dispatchEvent(new Event('userLogout'))
    }

    return { user, loading, logout, isAuthenticated: !!user }
}
