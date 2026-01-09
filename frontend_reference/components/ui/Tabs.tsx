'use client';

import React, { useState } from 'react';

interface Tab {
    label: string;
    content: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    defaultTab?: number;
}

const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab = 0 }) => {
    const [activeTab, setActiveTab] = useState(defaultTab);

    return (
        <div className="w-full">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        className={`py-2 px-4 text-sm font-medium text-center border-b-2 transition-colors duration-200 focus:outline-none ${activeTab === index
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                        onClick={() => setActiveTab(index)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="p-4">
                {tabs.map((tab, index) => (
                    <div
                        key={index}
                        className={`${activeTab === index ? 'block' : 'hidden'} animate-fade-in`}
                    >
                        {tab.content}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tabs;
