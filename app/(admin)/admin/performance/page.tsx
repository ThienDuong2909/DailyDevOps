'use client';

import { useState } from 'react';

// Sample performance data - easily replaceable with API data
const sampleStats = [
    { label: 'Total Visits', value: '142,593', change: '+12.5%', positive: true, icon: 'trending_up', iconBg: 'bg-primary/10 text-primary' },
    { label: 'Unique Visitors', value: '89,402', change: '+8.2%', positive: true, icon: 'person', iconBg: 'bg-purple-500/10 text-purple-500' },
    { label: 'Page Views', value: '452.1K', change: '+15.3%', positive: true, icon: 'visibility', iconBg: 'bg-blue-500/10 text-blue-500' },
    { label: 'Avg. Session', value: '4m 32s', change: '-1.2%', positive: false, icon: 'timer', iconBg: 'bg-orange-500/10 text-orange-500' },
    { label: 'Bounce Rate', value: '42.8%', change: '-5.1%', positive: true, icon: 'call_missed_outgoing', iconBg: 'bg-red-500/10 text-red-500' },
];

const sampleTopPages = [
    { url: '/kubernetes-autoscaling', title: 'Kubernetes Autoscaling Guide', views: '45,230', avgTime: '6m 12s' },
    { url: '/cicd-best-practices', title: 'CI/CD Best Practices', views: '38,102', avgTime: '5m 45s' },
    { url: '/docker-security', title: 'Docker Security Hardening', views: '29,845', avgTime: '4m 32s' },
    { url: '/terraform-guide', title: 'Terraform Complete Guide', views: '24,567', avgTime: '7m 18s' },
    { url: '/github-actions', title: 'GitHub Actions Tutorial', views: '21,890', avgTime: '5m 03s' },
];

const sampleTrafficSources = [
    { source: 'Organic Search', visits: '68,432', percentage: 48 },
    { source: 'Direct', visits: '35,648', percentage: 25 },
    { source: 'Social Media', visits: '21,389', percentage: 15 },
    { source: 'Referral', visits: '11,407', percentage: 8 },
    { source: 'Email', visits: '5,717', percentage: 4 },
];

export default function PerformancePage() {
    const [selectedPeriod, setSelectedPeriod] = useState('Last 7 Days');
    const [activeTab, setActiveTab] = useState('Visits');

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[#617589]">Overview for:</span>
                    <div className="relative">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="appearance-none bg-surface-dark border border-border-dark text-white text-sm rounded-lg pl-3 pr-10 py-2 focus:ring-primary focus:border-primary cursor-pointer font-medium shadow-sm"
                        >
                            <option>Last 24 Hours</option>
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>This Quarter</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#617589] text-[20px]">
                            expand_more
                        </span>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm font-medium text-white hover:bg-[#283039] transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Export Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 rounded-lg text-sm font-medium text-white transition-colors shadow-md shadow-primary/20">
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {sampleStats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-surface-dark p-5 rounded-xl border border-border-dark shadow-sm flex flex-col gap-1"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-[#617589]">{stat.label}</span>
                            <span className={`material-symbols-outlined ${stat.iconBg} p-1 rounded`}>{stat.icon}</span>
                        </div>
                        <span className="text-2xl font-bold text-white mt-2">{stat.value}</span>
                        <div
                            className={`flex items-center gap-1 text-xs font-medium mt-1 ${stat.positive ? 'text-green-400' : 'text-red-400'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">
                                {stat.positive ? 'arrow_upward' : 'arrow_downward'}
                            </span>
                            <span>{stat.change} vs last period</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Traffic Overview Chart */}
                <div className="lg:col-span-2 bg-surface-dark p-6 rounded-xl border border-border-dark shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">Traffic Overview</h3>
                            <p className="text-xs text-[#617589]">Visitors over time</p>
                        </div>
                        <div className="flex gap-2">
                            {['Visits', 'Bandwidth'].map((tab) => (
                                <span
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-2 py-1 text-xs font-medium rounded cursor-pointer transition-colors ${activeTab === tab
                                            ? 'bg-primary/10 text-primary'
                                            : 'hover:bg-[#283039] text-[#617589]'
                                        }`}
                                >
                                    {tab}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="relative w-full h-[300px]">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                            <defs>
                                <linearGradient id="performanceGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#137fec" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            <line stroke="#283039" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="60" y2="60" />
                            <line stroke="#283039" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="120" y2="120" />
                            <line stroke="#283039" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="180" y2="180" />
                            <line stroke="#283039" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="240" y2="240" />
                            {/* Chart Line */}
                            <path
                                d="M0,240 C50,220 100,200 150,180 C200,160 250,170 300,150 C350,130 400,120 450,100 C500,80 550,90 600,70 C650,50 700,60 750,80 C800,100 850,90 900,110 C950,130 1000,120 1000,120"
                                fill="none"
                                stroke="#137fec"
                                strokeLinecap="round"
                                strokeWidth="3"
                            />
                            {/* Fill */}
                            <path
                                d="M0,240 C50,220 100,200 150,180 C200,160 250,170 300,150 C350,130 400,120 450,100 C500,80 550,90 600,70 C650,50 700,60 750,80 C800,100 850,90 900,110 C950,130 1000,120 1000,120 V300 H0 Z"
                                fill="url(#performanceGradient)"
                            />
                        </svg>
                    </div>

                    <div className="flex justify-between text-[#9dabb9] text-xs font-mono mt-4">
                        <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </div>

                {/* Traffic Sources */}
                <div className="lg:col-span-1 bg-surface-dark p-6 rounded-xl border border-border-dark shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-6">Traffic Sources</h3>
                    <div className="flex flex-col gap-4">
                        {sampleTrafficSources.map((source, index) => (
                            <div key={index} className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#9dabb9]">{source.source}</span>
                                    <span className="text-white font-medium">{source.visits}</span>
                                </div>
                                <div className="h-2 bg-[#283039] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full transition-all duration-500"
                                        style={{ width: `${source.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Pages Table */}
            <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                <div className="bg-[#111418] border-b border-border-dark p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold text-base">Top Performing Pages</h3>
                    <button className="text-primary text-sm font-medium hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#283039] text-[#9dabb9] text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Page</th>
                                <th className="px-6 py-4">Views</th>
                                <th className="px-6 py-4">Avg. Time on Page</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark text-sm text-white">
                            {sampleTopPages.map((page, index) => (
                                <tr key={index} className="hover:bg-[#283039]/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{page.title}</div>
                                        <div className="text-xs text-[#9dabb9]">{page.url}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono">{page.views}</td>
                                    <td className="px-6 py-4 font-mono">{page.avgTime}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-primary hover:text-primary/80 transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
