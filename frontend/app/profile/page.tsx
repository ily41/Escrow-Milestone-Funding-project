'use client'

import { useAuth } from '@/hooks/useAuth'
import { useGetWalletQuery } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import { format } from 'date-fns'
import Image from 'next/image'

export default function ProfilePage() {
    const { user } = useAuth()
    const { data: wallet, isLoading: walletLoading, error: walletError } = useGetWalletQuery(undefined, {
        skip: !user,
    })

    // Mock data for fallback
    const mockBalance = '1,234.56'
    const mockCurrency = 'ETH'
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`

    return (
        <AuthGuard>
            <div className="min-h-screen bg-bg pb-12">
                {/* Banner Section */}
                <div className="h-48 bg-gradient-to-r from-primary to-secondary relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute -bottom-16 left-0 right-0 h-32 bg-gradient-to-t from-bg to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 -mt-20 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Profile Sidebar */}
                        <div className="w-full md:w-1/3 lg:w-1/4">
                            <div className="card p-6 text-center">
                                <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-surface shadow-lg bg-surface">
                                    <Image
                                        src={profileImage}
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>{user?.username}</h1>
                                <p className="text-sm mb-4" style={{ color: 'var(--text)', opacity: 0.7 }}>{user?.email}</p>

                                <div className="flex justify-center gap-2 mb-6">
                                    {user?.is_creator && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 uppercase tracking-wider">
                                            Creator
                                        </span>
                                    )}
                                    {user?.is_backer && (
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 uppercase tracking-wider">
                                            Backer
                                        </span>
                                    )}
                                </div>

                                <div className="border-t border-border pt-4 text-left">
                                    <div className="mb-2">
                                        <span className="text-xs uppercase tracking-wider font-semibold opacity-60">Member Since</span>
                                        <div className="text-sm">{user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">

                            {/* Wallet Card */}
                            <div className="card bg-gradient-to-br from-surface to-surface/50 border-primary/20">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Wallet Balance</h2>
                                        <p className="text-sm opacity-70">Available funds for pledging and withdrawals</p>
                                    </div>
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    {walletLoading ? (
                                        <div className="animate-pulse h-10 bg-gray-200 rounded w-1/3"></div>
                                    ) : (
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold text-primary">
                                                {wallet?.balance ? parseFloat(wallet.balance).toLocaleString() : mockBalance}
                                            </span>
                                            <span className="text-xl font-medium opacity-70">
                                                {wallet?.currency || mockCurrency}
                                            </span>
                                        </div>
                                    )}
                                    {walletError && !walletLoading && (
                                        <p className="text-xs text-amber-500 mt-2 flex items-center gap-1">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            Using mock data (Network unavailable)
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <button className="btn-primary flex-1 flex justify-center items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        Add Funds
                                    </button>
                                    <button className="btn-secondary flex-1 flex justify-center items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Withdraw
                                    </button>
                                </div>
                            </div>

                            {/* Recent Activity Placeholder */}
                            <div className="card">
                                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>Recent Activity</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14H11V21L20 10H13Z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium">Pledged to Project Alpha</div>
                                                <div className="text-xs opacity-60">2 days ago</div>
                                            </div>
                                            <div className="font-semibold text-primary">- 0.5 ETH</div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-4 text-center text-sm text-primary hover:underline">View All Activity</button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    )
}
