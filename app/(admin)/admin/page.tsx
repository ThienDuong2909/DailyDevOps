'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Sample data - can be easily replaced with API data
const sampleStats = {
    totalViews: '142.5k',
    viewsChange: '+12.5%',
    serverUptime: '99.98%',
    uptimeStatus: 'Stable',
    pendingComments: 23,
    newSubscribers: '1,042',
    subscribersChange: '+8.1%',
};

const sampleLogs = [
    { time: '10:42:01', type: 'INFO', message: 'Started Scheduled backup.' },
    { time: '10:42:05', type: 'INFO', message: 'Backup completed in 4.2s.' },
    { time: '10:45:12', type: 'GET', message: '/api/v1/articles/stats 200 OK' },
    { time: '10:45:15', type: 'GET', message: '/admin/dashboard 200 OK' },
    { time: '10:48:00', type: 'WARN', message: 'Memory usage spike detected (85%)' },
    { time: '10:48:01', type: 'INFO', message: 'Garbage collection started.' },
    { time: '10:48:02', type: 'INFO', message: 'GC finished. Memory stable (45%).' },
    { time: '10:52:43', type: 'ERR', message: 'Failed login attempt from 192.168.1.1' },
    { time: '10:55:00', type: 'GET', message: '/sitemap.xml 200 OK' },
];

const sampleArticles = [
    {
        id: '1',
        title: 'Kubernetes for Beginners',
        slug: '/k8s-beginners-guide',
        author: 'Sarah L.',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnZCGrFGbf56yICttdpKRprUs_mwoAgImdoVlhbNKWHqRKW2e27qdhlrPimlZCwVIF-7V1G1a9zwlq4ZwdklZU8RUjUiTDl6bo_8yZBSVtDDE0hFslldpMjG7zKKB2ow3WE60B__RiO6y29cv9V_msqpeVKYhPA4eQ1mUPkS0WMWYOIkA-BAokhITO8h1TXcBUpdtxsC255HBYSOQaWpo3RP6EEfbgHkw89YcnwA4MHEG1uD_r2dFywFjjJvFazSj75LEBniC7C1Jm',
        status: 'Published',
        views: '12,405',
    },
    {
        id: '2',
        title: 'CI/CD Pipeline Best Practices',
        slug: '/cicd-best-practices',
        author: 'Mike R.',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8_5VEGoMEkoBd2TLyY-qDhLB9bNFIFrvlEn2xusfrKZGABnfe-HfHMrSoTzIZWHA_DvYkF7auOEs4knWmgYas-saCZm06BxZsOkO_d7T-m5aYpPdwAIVDn833q_ekX0M3YDFTCnQtUOvzInLL0ADVPpfejfzy37j4ZIQVjQB7FfgaQTkniwbcKe3RfstsAkNf9bdzhYkYckTQ1atbK0-_Ve2ZFwlgAmqzcMQ3dOTCmPRRozVSMyd7USjSwU-EHeVV3Wb2jRlTh27R',
        status: 'Draft',
        views: '0',
    },
    {
        id: '3',
        title: 'Docker Security Hardening',
        slug: '/docker-security',
        author: 'Sarah L.',
        authorAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnZCGrFGbf56yICttdpKRprUs_mwoAgImdoVlhbNKWHqRKW2e27qdhlrPimlZCwVIF-7V1G1a9zwlq4ZwdklZU8RUjUiTDl6bo_8yZBSVtDDE0hFslldpMjG7zKKB2ow3WE60B__RiO6y29cv9V_msqpeVKYhPA4eQ1mUPkS0WMWYOIkA-BAokhITO8h1TXcBUpdtxsC255HBYSOQaWpo3RP6EEfbgHkw89YcnwA4MHEG1uD_r2dFywFjjJvFazSj75LEBniC7C1Jm',
        status: 'Published',
        views: '8,234',
    },
];

const sampleSeoScores = [
    { label: 'SEO Score', value: 92, color: '#0bda5b' },
    { label: 'Performance', value: 88, color: '#137fec' },
    { label: 'Accessibility', value: 95, color: '#0bda5b' },
];

function getLogTypeColor(type: string) {
    switch (type) {
        case 'INFO':
            return 'text-[#0bda5b]';
        case 'GET':
        case 'POST':
            return 'text-[#137fec]';
        case 'WARN':
            return 'text-[#eab308]';
        case 'ERR':
            return 'text-[#fa6238]';
        default:
            return 'text-white';
    }
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'Published':
            return 'bg-green-900/30 text-green-400 border-green-900';
        case 'Draft':
            return 'bg-yellow-900/30 text-yellow-400 border-yellow-900';
        case 'Archived':
            return 'bg-gray-900/30 text-gray-400 border-gray-900';
        default:
            return 'bg-gray-900/30 text-gray-400 border-gray-900';
    }
}

export default function AdminDashboardPage() {
    const [selectedPeriod, setSelectedPeriod] = useState('7d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API loading
        const timer = setTimeout(() => setLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="max-w-[1400px] mx-auto flex flex-col gap-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Views */}
                <div className="bg-[#1e293b] border border-border-dark rounded-xl p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start">
                        <p className="text-[#9dabb9] text-sm font-medium">Total Views</p>
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">
                            visibility
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-white text-2xl font-bold font-mono">{sampleStats.totalViews}</p>
                        <span className="text-[#0bda5b] text-xs font-medium mb-1 flex items-center">
                            <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                            {sampleStats.viewsChange}
                        </span>
                    </div>
                </div>

                {/* Server Uptime */}
                <div className="bg-[#1e293b] border border-border-dark rounded-xl p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start">
                        <p className="text-[#9dabb9] text-sm font-medium">Server Uptime</p>
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">
                            dns
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-white text-2xl font-bold font-mono">{sampleStats.serverUptime}</p>
                        <span className="text-[#0bda5b] text-xs font-medium mb-1 flex items-center">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span>
                            {sampleStats.uptimeStatus}
                        </span>
                    </div>
                </div>

                {/* Pending Comments */}
                <div className="bg-[#1e293b] border border-border-dark rounded-xl p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start">
                        <p className="text-[#9dabb9] text-sm font-medium">Pending Comments</p>
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">
                            forum
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-white text-2xl font-bold font-mono">{sampleStats.pendingComments}</p>
                        <span className="text-[#fa6238] text-xs font-medium mb-1 flex items-center">
                            Needs Review
                        </span>
                    </div>
                </div>

                {/* New Subscribers */}
                <div className="bg-[#1e293b] border border-border-dark rounded-xl p-5 flex flex-col gap-3 hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start">
                        <p className="text-[#9dabb9] text-sm font-medium">New Subscribers</p>
                        <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-lg text-lg">
                            group_add
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-white text-2xl font-bold font-mono">{sampleStats.newSubscribers}</p>
                        <span className="text-[#0bda5b] text-xs font-medium mb-1 flex items-center">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                            {sampleStats.subscribersChange}
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts & Terminal Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="xl:col-span-2 bg-[#1e293b] border border-border-dark rounded-xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-white font-bold text-lg">Traffic Analytics</h3>
                            <p className="text-[#9dabb9] text-xs mt-1">Request volume over last 7 days</p>
                        </div>
                        <div className="flex bg-[#283039] rounded-lg p-1 gap-1">
                            {['7d', '30d', '90d'].map((period) => (
                                <button
                                    key={period}
                                    onClick={() => setSelectedPeriod(period)}
                                    className={`px-3 py-1 text-xs font-medium rounded ${selectedPeriod === period
                                            ? 'text-white bg-[#3b4754] shadow-sm'
                                            : 'text-[#9dabb9] hover:text-white'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 min-h-[250px] w-full relative">
                        <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 300">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#137fec" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#137fec" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            {/* Grid Lines */}
                            <line stroke="#283039" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="225" y2="225" />
                            <line stroke="#283039" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150" />
                            <line stroke="#283039" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="1000" y1="75" y2="75" />
                            {/* The Chart Line */}
                            <path
                                d="M0,220 C100,220 150,100 250,120 C350,140 400,180 500,150 C600,120 650,50 750,80 C850,110 900,180 1000,160"
                                fill="none"
                                stroke="#137fec"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                            />
                            {/* Fill */}
                            <path
                                d="M0,220 C100,220 150,100 250,120 C350,140 400,180 500,150 C600,120 650,50 750,80 C850,110 900,180 1000,160 V300 H0 Z"
                                fill="url(#chartGradient)"
                                stroke="none"
                            />
                            {/* Data Points */}
                            <circle cx="250" cy="120" fill="#137fec" r="4" stroke="#1e293b" strokeWidth="2" />
                            <circle cx="500" cy="150" fill="#137fec" r="4" stroke="#1e293b" strokeWidth="2" />
                            <circle cx="750" cy="80" fill="#137fec" r="4" stroke="#1e293b" strokeWidth="2" />
                        </svg>
                    </div>
                    <div className="flex justify-between text-[#9dabb9] text-xs font-mono mt-4 px-2">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                    </div>
                </div>

                {/* System Logs Terminal */}
                <div className="xl:col-span-1 bg-[#0f1216] border border-border-dark rounded-xl flex flex-col shadow-inner">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#283039] bg-[#161b22] rounded-t-xl">
                        <div className="flex gap-2">
                            <div className="size-3 rounded-full bg-[#fa6238]" />
                            <div className="size-3 rounded-full bg-[#eab308]" />
                            <div className="size-3 rounded-full bg-[#0bda5b]" />
                        </div>
                        <span className="text-[#9dabb9] text-xs font-mono">systemd-journal</span>
                    </div>
                    <div className="flex-1 p-4 font-mono text-xs overflow-y-auto custom-scrollbar h-[300px] lg:h-auto text-white">
                        <div className="flex flex-col gap-1.5">
                            {sampleLogs.map((log, index) => (
                                <div key={index} className="flex gap-2">
                                    <span className="text-[#586069]">{log.time}</span>
                                    <span className={getLogTypeColor(log.type)}>{log.type}</span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                            <div className="flex gap-2 text-[#9dabb9] animate-pulse">_</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Articles & SEO */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 pb-6">
                {/* Recent Articles Table */}
                <div className="xl:col-span-2 bg-[#1e293b] border border-border-dark rounded-xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-border-dark flex justify-between items-center bg-[#111418]">
                        <h3 className="text-white font-bold text-base">Recent Articles</h3>
                        <Link href="/admin/articles" className="text-primary text-sm font-medium hover:underline">
                            View All
                        </Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#283039] text-[#9dabb9] text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Article Title</th>
                                    <th className="px-6 py-4">Author</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Views</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-dark text-sm text-white">
                                {sampleArticles.map((article) => (
                                    <tr key={article.id} className="hover:bg-[#283039]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium">{article.title}</div>
                                            <div className="text-xs text-[#9dabb9]">{article.slug}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="size-6 rounded-full bg-cover bg-center"
                                                    style={{ backgroundImage: `url("${article.authorAvatar}")` }}
                                                />
                                                <span>{article.author}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(article.status)}`}
                                            >
                                                {article.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono">{article.views}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-[#9dabb9] hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SEO Performance */}
                <div className="xl:col-span-1 bg-[#1e293b] border border-border-dark rounded-xl p-6 flex flex-col">
                    <h3 className="text-white font-bold text-base mb-6">SEO Performance</h3>
                    <div className="flex flex-col gap-5">
                        {sampleSeoScores.map((score, index) => (
                            <div key={index} className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#9dabb9]">{score.label}</span>
                                    <span className="text-white font-bold font-mono">{score.value}/100</span>
                                </div>
                                <div className="h-2 bg-[#283039] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${score.value}%`, backgroundColor: score.color }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link
                        href="/admin/seo"
                        className="mt-6 flex items-center justify-center gap-2 py-3 bg-[#283039] hover:bg-[#3b4754] text-white font-medium text-sm rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">tune</span>
                        Open SEO Manager
                    </Link>
                </div>
            </div>
        </div>
    );
}
