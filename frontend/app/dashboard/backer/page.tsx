'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPledges, getRefunds, getWallets } from '@/lib/api'
import { getCurrentUser } from '@/lib/api'
import type { Pledge, Refund, Wallet, User } from '@/lib/types'
import { format } from 'date-fns'

export default function BackerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [pledges, setPledges] = useState<Pledge[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [userData, pledgesData, refundsData, walletsData] = await Promise.all([
        getCurrentUser(),
        getPledges(),
        getRefunds(),
        getWallets(),
      ])
      setUser(userData)
      setPledges(pledgesData)
      setRefunds(refundsData)
      setWallets(walletsData)
    } catch (error) {
      console.error('Failed to load data:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-gray-900 dark:text-white">Loading...</div>
  }

  const totalPledged = pledges
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

  const totalRefunded = refunds
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0)

  const walletBalance = wallets.reduce((sum, w) => sum + parseFloat(w.balance), 0)

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>Backer Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)', opacity: 0.7 }}>Wallet Balance</h3>
          <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
            ${walletBalance.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)', opacity: 0.7 }}>Total Pledged</h3>
          <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
            ${totalPledged.toLocaleString()}
          </p>
        </div>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)', opacity: 0.7 }}>Total Refunded</h3>
          <p className="text-3xl font-bold" style={{ color: 'var(--success)' }}>
            ${totalRefunded.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>My Pledges</h2>
          {pledges.length === 0 ? (
            <div className="card text-center py-12">
              <p className="mb-4" style={{ color: 'var(--text)', opacity: 0.7 }}>You haven't made any pledges yet.</p>
              <Link href="/projects" className="btn-primary">
                Browse Projects
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pledges.map((pledge) => (
                <div key={pledge.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/projects/${pledge.project.id}`}>
                        <h3 className="text-lg font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--text)' }}>
                          {pledge.project.title}
                        </h3>
                      </Link>
                      <p className="mt-1" style={{ color: 'var(--text)', opacity: 0.8 }}>
                        {pledge.currency} {parseFloat(pledge.amount).toLocaleString()}
                      </p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text)', opacity: 0.6 }}>
                        {format(new Date(pledge.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                      backgroundColor: pledge.status === 'active' ? 'var(--success)' : pledge.status === 'refunded' ? 'var(--border)' : 'var(--primary)',
                      opacity: 0.2,
                      color: pledge.status === 'active' ? 'var(--success)' : pledge.status === 'refunded' ? 'var(--text)' : 'var(--primary)'
                    }}>
                      {pledge.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>Refunds</h2>
          {refunds.length === 0 ? (
            <div className="card text-center py-12">
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>No refunds yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {refunds.map((refund) => (
                <div key={refund.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        {refund.pledge.project.title}
                      </h3>
                      <p className="mt-1" style={{ color: 'var(--text)', opacity: 0.8 }}>{refund.reason}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text)', opacity: 0.7 }}>
                        Amount: ${parseFloat(refund.amount).toLocaleString()}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                        {format(new Date(refund.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                      backgroundColor: refund.status === 'processed' ? 'var(--success)' : refund.status === 'requested' ? 'var(--secondary)' : 'var(--primary)',
                      opacity: 0.2,
                      color: refund.status === 'processed' ? 'var(--success)' : refund.status === 'requested' ? 'var(--text)' : 'var(--primary)'
                    }}>
                      {refund.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
