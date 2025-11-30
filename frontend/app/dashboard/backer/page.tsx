'use client'

import { useAuth } from '@/hooks/useAuth'
import { useGetPledgesQuery, useGetRefundsQuery } from '@/lib/api'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'

export default function BackerDashboard() {
  const { user, loading: authLoading } = useAuth()

  const { data: pledges = [], isLoading: pledgesLoading } = useGetPledgesQuery(
    { backer: user?.id },
    { skip: !user }
  )

  const { data: refunds = [], isLoading: refundsLoading } = useGetRefundsQuery(
    { backer: user?.id },
    { skip: !user }
  )

  if (authLoading || pledgesLoading || refundsLoading) {
    return (
      <div className="container mx-auto px-4 py-8" style={{ color: 'var(--text)' }}>
        Loading...
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
            Login Required
          </h2>
          <p className="mb-4" style={{ color: 'var(--text)', opacity: 0.8 }}>
            Please login to access your backer dashboard.
          </p>
          <Link href="/auth/login" className="btn-primary">
            Login
          </Link>
        </div>
      </div>
    )
  }

  const totalPledged = pledges.reduce((sum: number, pledge: any) => sum + parseFloat(pledge.amount || 0), 0)

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>
          Backer Dashboard
        </h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)', opacity: 0.7 }}>
              Total Pledged
            </h3>
            <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
              ${totalPledged.toLocaleString()}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)', opacity: 0.7 }}>
              Active Pledges
            </h3>
            <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
              {pledges.length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text)', opacity: 0.7 }}>
              Refunds Received
            </h3>
            <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
              {refunds.length}
            </p>
          </div>
        </div>

        {/* My Pledges */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
            My Pledges
          </h2>
          {pledges.length === 0 ? (
            <div className="card text-center py-12">
              <p style={{ color: 'var(--text)', opacity: 0.7 }}>
                You haven't made any pledges yet.
              </p>
              <Link href="/projects" className="btn-primary mt-4 inline-block">
                Explore Projects
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {pledges.map((pledge: any) => (
                <div key={pledge.pledge_id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/projects/${pledge.project_id}`}>
                        <h3 className="text-xl font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--text)' }}>
                          {pledge.project_title || `Project #${pledge.project_id}`}
                        </h3>
                      </Link>
                      <div className="mt-2 flex gap-4 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                        <span>Amount: ${parseFloat(pledge.amount || '0').toLocaleString()}</span>
                        <span>Date: {new Date(pledge.pledged_at || pledge.created_at || Date.now()).toLocaleDateString()}</span>
                        <span className="capitalize">Status: {typeof pledge.status === 'number' ? (pledge.status === 1 ? 'active' : 'inactive') : pledge.status}</span>
                      </div>
                    </div>
                    <Link href={`/projects/${pledge.project_id}`} className="btn-secondary text-sm">
                      View Project
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refunds */}
        {refunds.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Refunds
            </h2>
            <div className="space-y-4">
              {refunds.map((refund: any) => (
                <div key={refund.refund_id} className="card">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                        Refund for {refund.project_title || `Project #${refund.project_id}`}
                      </h3>
                      <div className="mt-2 flex gap-4 text-sm" style={{ color: 'var(--text)', opacity: 0.7 }}>
                        <span>Amount: ${parseFloat(refund.amount || '0').toLocaleString()}</span>
                        <span>Date: {new Date(refund.refunded_at || refund.processed_at || refund.requested_at || Date.now()).toLocaleDateString()}</span>
                        <span className="capitalize">Status: {typeof refund.status === 'number' ? (refund.status === 1 ? 'processed' : 'requested') : refund.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
