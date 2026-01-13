'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AnalyticsChart from '@/components/admin/AnalyticsChart';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import Skeleton from '@/components/ui/Skeleton';

const AdminDashboard = () => {
    // Mock data for charts
    const activityData = [
        { label: 'Mon', value: 120 },
        { label: 'Tue', value: 200 },
        { label: 'Wed', value: 150 },
        { label: 'Thu', value: 300 },
        { label: 'Fri', value: 250 },
        { label: 'Sat', value: 400 },
        { label: 'Sun', value: 350 },
    ];

    const workspaceData = [
        { label: 'Active', value: 45 },
        { label: 'Inactive', value: 12 },
        { label: 'Archived', value: 5 },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <AdminSidebar />
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                        <p className="text-gray-500 dark:text-gray-400">Welcome back, Admin</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="btn-primary">
                            Create Workspace
                        </button>
                    </div>
                </header>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <AnalyticsChart data={activityData} title="Weekly User Activity" color="#8B0000" />
                    <AnalyticsChart data={workspaceData} title="Workspace Status" color="#D4AF37" />
                </div>

                {/* Bento Grid for Quick Actions/Stats */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Stats</h2>
                <BentoGrid className="max-w-full mx-0">
                    <BentoGridItem
                        title="Total Users"
                        description="Active users across all workspaces"
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"><span className="text-4xl font-bold m-auto text-gray-500">1,234</span></div>}
                        className="md:col-span-1"
                        icon={<svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    />
                    <BentoGridItem
                        title="Active Projects"
                        description="Projects currently in progress"
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"><span className="text-4xl font-bold m-auto text-gray-500">85</span></div>}
                        className="md:col-span-1"
                        icon={<svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                    />
                    <BentoGridItem
                        title="Pending Approvals"
                        description="Requests waiting for review"
                        header={<div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"><span className="text-4xl font-bold m-auto text-yellow-500">12</span></div>}
                        className="md:col-span-1"
                        icon={<svg className="w-6 h-6 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                </BentoGrid>

                {/* Recent Activity Table (Skeleton for now) */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                        <Skeleton height="3rem" />
                        <Skeleton height="3rem" />
                        <Skeleton height="3rem" />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
