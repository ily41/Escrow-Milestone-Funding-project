'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGetMilestonesQuery, useGetProjectsQuery } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type { Milestone, Project } from '@/lib/types'

interface Notification {
    id: string
    message: string
    type: 'info' | 'success' | 'warning'
    time: Date
    read: boolean
}

export default function NotificationCenter() {
    const { user } = useAuth()
    const { data: projectsData = [] } = useGetProjectsQuery({})
    const projects = Array.isArray(projectsData) ? projectsData : (projectsData as any).results || []

    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])

    // In a real app, notifications would come from the backend.
    // Here we'll derive them from milestone status changes for demonstration.
    // We'll filter for milestones where status is 'Voting' or 'Paid'

    useEffect(() => {
        if (!user || projects.length === 0) return

        const newNotifications: Notification[] = []

        // Derive notifications from milestone statuses
        projects.forEach((project: Project) => {
            if (project.milestones) {
                project.milestones.forEach((m: Milestone) => {
                    const status = String(m.status)
                    if (status === '2' || status === 'voting') {
                        newNotifications.push({
                            id: `voting-${m.milestone_id}`,
                            message: `Milestone "${m.title}" in ${project.title} is now open for voting!`,
                            type: 'warning',
                            time: new Date(),
                            read: false
                        })
                    } else if (status === '3' || status === 'completed') {
                        newNotifications.push({
                            id: `completed-${m.milestone_id}`,
                            message: `Milestone "${m.title}" in ${project.title} has been completed!`,
                            type: 'success',
                            time: new Date(),
                            read: false
                        })
                    }
                })
            }
        })

        if (newNotifications.length > 0) {
            setNotifications(prev => {
                const existingIds = new Set(prev.map(n => n.id))
                const filteredNew = newNotifications.filter(n => !existingIds.has(n.id))
                if (filteredNew.length === 0) return prev
                return [...prev, ...filteredNew]
            })
        }
    }, [user])

    const unreadCount = notifications.filter(n => !n.read).length

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-surface-light transition-colors relative group"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-text hover:text-primary transition-colors"
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold border-2 border-surface">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-border flex justify-between items-center bg-surface-light">
                                <h3 className="font-bold text-text">Notifications</h3>
                                <button
                                    onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}
                                    className="text-xs text-primary hover:underline"
                                >
                                    Mark all as read
                                </button>
                            </div>

                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-text opacity-50 italic">
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => markAsRead(notif.id)}
                                            className={`p-4 border-b border-border hover:bg-surface-light transition-colors cursor-pointer relative ${!notif.read ? 'bg-primary/5' : ''
                                                }`}
                                        >
                                            {!notif.read && (
                                                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full" />
                                            )}
                                            <div className="pl-2">
                                                <p className={`text-sm ${!notif.read ? 'font-semibold' : ''} text-text`}>
                                                    {notif.message}
                                                </p>
                                                <span className="text-[10px] text-text opacity-50 mt-1 block">
                                                    {notif.time.toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
