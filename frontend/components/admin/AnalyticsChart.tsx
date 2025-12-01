'use client';

import React from 'react';

interface DataPoint {
    label: string;
    value: number;
}

interface AnalyticsChartProps {
    data: DataPoint[];
    title: string;
    color?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, title, color = '#4CAF50' }) => {
    const maxValue = Math.max(...data.map((d) => d.value));
    const chartHeight = 200;
    const barWidth = 40;
    const gap = 20;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
            <div className="flex items-end space-x-4 h-[200px] w-full overflow-x-auto pb-2">
                {data.map((point, index) => {
                    const height = (point.value / maxValue) * chartHeight;
                    return (
                        <div key={index} className="flex flex-col items-center group">
                            <div className="relative flex items-end h-full">
                                <div
                                    className="w-10 rounded-t-md transition-all duration-500 ease-out hover:opacity-80"
                                    style={{
                                        height: `${height}px`,
                                        backgroundColor: color,
                                    }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {point.value}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">{point.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AnalyticsChart;
