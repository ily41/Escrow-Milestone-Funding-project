'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useRegisterMutation, useLoginMutation } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [register, { isLoading: isRegistering }] = useRegisterMutation()
  const [login] = useLoginMutation()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    role: 'backer' as 'creator' | 'backer',
  })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.password2) {
      setError('Passwords do not match')
      return
    }

    try {
      // Map form data to backend expectations
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.password2,
        is_creator: formData.role === 'creator',
        is_backer: true // All users are backers by default
      }

      await register(registrationData).unwrap()

      // Auto-login after registration
      const loginResult = await login({
        username: formData.username,
        password: formData.password,
      }).unwrap()

      // Store tokens
      localStorage.setItem('access_token', loginResult.access)
      localStorage.setItem('refresh_token', loginResult.refresh)

      // Dispatch custom event to notify Navbar
      window.dispatchEvent(new Event('userLogin'))
      router.push('/')
      router.refresh()
    } catch (err: any) {
      const errorMessage = err?.data?.error || err?.data?.message || err?.data?.detail || err?.error || 'Registration failed'
      setError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="px-4 py-3 rounded" style={{ backgroundColor: 'var(--primary)', opacity: 0.1, border: '1px solid var(--primary)', color: 'var(--primary)' }}>
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 p-1 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text)', opacity: 0.6 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="password2" className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="password2"
                  name="password2"
                  type={showPassword2 ? 'text' : 'password'}
                  required
                  value={formData.password2}
                  onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                  className="input-field mt-1 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 mt-1 p-1 hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text)', opacity: 0.6 }}
                  aria-label={showPassword2 ? 'Hide password' : 'Show password'}
                >
                  {showPassword2 ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
                Account Type
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="role_backer"
                    name="role"
                    type="radio"
                    value="backer"
                    checked={formData.role === 'backer'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'creator' | 'backer' })}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="role_backer" className="ml-2 block text-sm" style={{ color: 'var(--text)' }}>
                    Backer - I want to fund projects
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="role_creator"
                    name="role"
                    type="radio"
                    value="creator"
                    checked={formData.role === 'creator'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'creator' | 'backer' })}
                    className="h-4 w-4"
                    style={{ accentColor: 'var(--primary)' }}
                  />
                  <label htmlFor="role_creator" className="ml-2 block text-sm" style={{ color: 'var(--text)' }}>
                    Creator - I want to create projects
                  </label>
                </div>
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--text)', opacity: 0.6 }}>
                You can link your wallet address after registration.
              </p>
            </div>
          </div>

          <div>
            <button type="submit" className="btn-primary w-full" disabled={isRegistering}>
              {isRegistering ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <span style={{ color: 'var(--text)', opacity: 0.7 }}>Already have an account? </span>
            <Link href="/auth/login" className="hover:opacity-80 transition-opacity" style={{ color: 'var(--primary)' }}>
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
