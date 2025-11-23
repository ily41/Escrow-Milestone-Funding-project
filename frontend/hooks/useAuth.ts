import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '@/lib/api'
import type { User } from '@/lib/types'

export function useAuth() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    const loadUser = async () => {
        const token = localStorage.getItem('access_token')
        if (token) {
            try {
                const userData = await getCurrentUser()
                setUser(userData)
            } catch (error) {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                setUser(null)
            } finally {
                setLoading(false)
            }
        } else {
            setUser(null)
            setLoading(false)
        }
    }

    useEffect(() => {
        loadUser()

        // Listen for storage changes (when token is set/removed from other tabs)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'access_token') {
                loadUser()
            }
        }

        // Listen for custom login event (same window)
        const handleLogin = () => {
            loadUser()
        }

        window.addEventListener('storage', handleStorageChange)
        window.addEventListener('userLogin', handleLogin)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('userLogin', handleLogin)
        }
    }, [])

    const logout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
        router.push('/')
    }

    return { user, loading, logout }
}
