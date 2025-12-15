'use client'

import { useAuth } from '@/hooks/useAuth'
import { useGetWalletQuery, useUpdateUserMutation } from '@/lib/api'
import AuthGuard from '@/components/AuthGuard'
import { format } from 'date-fns'
import Image from 'next/image'
import { connectWallet, connectLocalWallet } from '@/lib/web3'
import { useState, useEffect } from 'react'
import { ethers } from 'ethers'

export default function ProfilePage() {
    const { user } = useAuth()
    const { data: wallet, isLoading: walletLoading, error: walletError } = useGetWalletQuery(undefined, {
        skip: !user,
    })
    const [updateUser] = useUpdateUserMutation()

    // State for external wallet
    const [externalBalance, setExternalBalance] = useState<string | null>(null)
    const [isConnecting, setIsConnecting] = useState(false)
    const [connectionError, setConnectionError] = useState<string | null>(null)

    // Mock data for fallback
    const mockCurrency = 'ETH'
    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`

    useEffect(() => {
        const fetchBalance = async () => {
            if (user?.wallet_address && user?.wallet_type) {
                try {
                    let provider;
                    if (user.wallet_type === 'metamask' && typeof window !== 'undefined' && (window as any).ethereum) {
                        provider = new ethers.BrowserProvider((window as any).ethereum)
                    } else if (user.wallet_type === 'local') {
                        provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
                    }

                    if (provider) {
                        const balance = await provider.getBalance(user.wallet_address)
                        setExternalBalance(ethers.formatEther(balance))
                    }
                } catch (err) {
                    console.error("Error fetching balance:", err)
                    setExternalBalance(null)
                }
            } else {
                setExternalBalance(null)
            }
        }

        fetchBalance()
    }, [user?.wallet_address, user?.wallet_type])

    const handleConnect = async (type: 'metamask' | 'local') => {
        setIsConnecting(true)
        setConnectionError(null)
        try {
            let address;
            if (type === 'metamask') {
                const result = await connectWallet()
                address = result.address
            } else {
                const result = await connectLocalWallet()
                address = result.address
            }

            // Link new wallet (replaces previous one)
            await updateUser({ wallet_address: address, wallet_type: type }).unwrap()

        } catch (err: any) {
            console.error(`${type} connection failed:`, err)
            setConnectionError(err.message || `Failed to connect ${type}`)
        } finally {
            setIsConnecting(false)
        }
    }

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to unlink your wallet?')) return;

        setIsConnecting(true)
        try {
            await updateUser({ wallet_address: null, wallet_type: null }).unwrap()
            setExternalBalance(null)
        } catch (err: any) {
            console.error("Disconnect failed:", err)
            setConnectionError("Failed to disconnect wallet")
        } finally {
            setIsConnecting(false)
        }
    }

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
                                    <div className="mt-4">
                                        <span className="text-xs uppercase tracking-wider font-semibold opacity-60">Wallet Address</span>
                                        <div className="text-sm font-mono break-all mt-1">
                                            {user?.wallet_address ? user.wallet_address : (
                                                <span className="text-amber-500 text-xs italic">Not linked</span>
                                            )}
                                        </div>
                                    </div>
                                    {user?.wallet_type && (
                                        <div className="mt-4">
                                            <span className="text-xs uppercase tracking-wider font-semibold opacity-60">Wallet Type</span>
                                            <div className="text-sm capitalize mt-1 text-primary">
                                                {user.wallet_type === 'metamask' ? 'MetaMask' : 'Local Wallet'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="w-full md:w-2/3 lg:w-3/4 space-y-6">

                            {/* Wallet Connections */}
                            <div className="card bg-gradient-to-br from-surface to-surface/50 border-primary/20">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>External Wallet</h2>
                                        <p className="text-sm opacity-70">Connect your Web3 wallet to fund projects</p>
                                    </div>
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* MetaMask Option */}
                                    <div className={`p-4 rounded-xl border-2 transition-all ${user?.wallet_type === 'metamask' ? 'border-primary bg-primary/5' : 'border-dashed border-border hover:border-primary/50'}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">M</div>
                                            <div className="font-semibold">MetaMask Wallet</div>
                                        </div>

                                        {user?.wallet_type === 'metamask' ? (
                                            <div>
                                                <div className="text-xs opacity-60 mb-1">Connected Address</div>
                                                <div className="text-sm font-mono truncate mb-3 text-primary">{user.wallet_address}</div>
                                                <div className="flex items-baseline gap-2 mb-3">
                                                    <span className="text-2xl font-bold text-primary">
                                                        {externalBalance ? parseFloat(externalBalance).toFixed(4) : '...'}
                                                    </span>
                                                    <span className="text-sm font-medium opacity-70">ETH</span>
                                                </div>
                                                <div className="text-xs text-green-500 flex items-center gap-1 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    Active Session
                                                </div>
                                                <button
                                                    onClick={handleDisconnect}
                                                    disabled={isConnecting}
                                                    className="text-xs text-red-500 hover:text-red-600 hover:underline"
                                                >
                                                    Unlink Wallet
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleConnect('metamask')}
                                                disabled={isConnecting}
                                                className="w-full btn-secondary text-sm"
                                            >
                                                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Local Wallet Option */}
                                    <div className={`p-4 rounded-xl border-2 transition-all ${user?.wallet_type === 'local' ? 'border-primary bg-primary/5' : 'border-dashed border-border hover:border-primary/50'}`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">L</div>
                                            <div className="font-semibold">Local Wallet</div>
                                        </div>

                                        {user?.wallet_type === 'local' ? (
                                            <div>
                                                <div className="text-xs opacity-60 mb-1">Connected Address</div>
                                                <div className="text-sm font-mono truncate mb-3 text-primary">{user.wallet_address}</div>
                                                <div className="flex items-baseline gap-2 mb-3">
                                                    <span className="text-2xl font-bold text-primary">
                                                        {externalBalance ? parseFloat(externalBalance).toFixed(4) : '...'}
                                                    </span>
                                                    <span className="text-sm font-medium opacity-70">ETH</span>
                                                </div>
                                                <div className="text-xs text-green-500 flex items-center gap-1 mb-3">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    Active Session
                                                </div>
                                                <button
                                                    onClick={handleDisconnect}
                                                    disabled={isConnecting}
                                                    className="text-xs text-red-500 hover:text-red-600 hover:underline"
                                                >
                                                    Unlink Wallet
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleConnect('local')}
                                                disabled={isConnecting}
                                                className="w-full btn-secondary text-sm"
                                            >
                                                {isConnecting ? 'Connecting...' : 'Connect Local'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {connectionError && <p className="text-sm text-center text-red-500 mt-2">{connectionError}</p>}
                                <p className="text-xs text-center opacity-50">Linking a new wallet will replace the existing connection.</p>
                            </div>

                            {/* Internal Platform Wallet (if needed for refunds/payouts) */}
                            <div className="card">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>Platform Balance</h2>
                                        <p className="text-sm opacity-70">Refunds and payouts</p>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-primary">
                                        {wallet?.balance ? parseFloat(wallet.balance).toLocaleString() : '0.00'}
                                    </span>
                                    <span className="text-lg font-medium opacity-70">
                                        {wallet?.currency || 'USD'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    )
}
