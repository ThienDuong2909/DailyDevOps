'use client';

import { useState } from 'react';

// Sample SEO data - easily replaceable with API data
const sampleStats = {
    healthScore: 92,
    organicTraffic: '+15.4%',
    indexedPages: 342,
    criticalIssues: 3,
};

const samplePages = [
    {
        id: '1',
        title: 'Home - DevOps Blog',
        url: '/',
        score: 95,
        status: 'Good',
        lastUpdated: '2 hours ago',
    },
    {
        id: '2',
        title: 'Kubernetes Autoscaling Guide',
        url: '/kubernetes-autoscaling-guide',
        score: 88,
        status: 'Needs Improvement',
        lastUpdated: '1 day ago',
    },
    {
        id: '3',
        title: 'CI/CD Best Practices',
        url: '/cicd-best-practices',
        score: 72,
        status: 'Poor',
        lastUpdated: '3 days ago',
    },
];

const sampleIssues = [
    { id: '1', type: 'error', message: 'Missing meta description on 3 pages', pages: 3 },
    { id: '2', type: 'warning', message: 'Images without alt text', pages: 12 },
    { id: '3', type: 'warning', message: 'Duplicate title tags detected', pages: 2 },
    { id: '4', type: 'info', message: 'Schema markup can be improved', pages: 8 },
];

function getScoreColor(score: number) {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'Good':
            return 'bg-green-500/10 text-green-500 border-green-500/20';
        case 'Needs Improvement':
            return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
        case 'Poor':
            return 'bg-red-500/10 text-red-500 border-red-500/20';
        default:
            return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
}

function getIssueIcon(type: string) {
    switch (type) {
        case 'error':
            return { icon: 'error', color: 'text-red-500 bg-red-500/10' };
        case 'warning':
            return { icon: 'warning', color: 'text-yellow-500 bg-yellow-500/10' };
        default:
            return { icon: 'info', color: 'text-blue-500 bg-blue-500/10' };
    }
}

export default function SEOManagerPage() {
    const [selectedPage, setSelectedPage] = useState('Home - DevOps Blog');
    const [formData, setFormData] = useState({
        title: 'DevOps Best Practices & Tutorials | DevOps Blog',
        slug: '',
        description: 'Learn DevOps best practices, CI/CD pipelines, Kubernetes, and cloud-native technologies.',
        keywords: 'devops, kubernetes, ci/cd, docker, automation',
    });

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <span className="material-symbols-outlined">score</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase">Overall Health Score</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.healthScore}/100</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase">Organic Traffic</p>
                        <h3 className="text-white text-xl font-bold">
                            {sampleStats.organicTraffic}{' '}
                            <span className="text-xs font-normal text-[#9dabb9] ml-1">vs last month</span>
                        </h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">link</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase">Indexed Pages</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.indexedPages}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase">Critical Issues</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.criticalIssues}</h3>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Page Optimization Form */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-[#111418] border-b border-border-dark p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">edit_document</span>
                                Page Optimization
                            </h3>
                            <div className="flex items-center gap-3">
                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={selectedPage}
                                        onChange={(e) => setSelectedPage(e.target.value)}
                                        className="appearance-none bg-[#283039] border border-border-dark rounded-lg pl-3 pr-8 py-1.5 text-sm text-[#9dabb9] focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-64 cursor-pointer"
                                    >
                                        <option>Select Page to Edit</option>
                                        {samplePages.map((page) => (
                                            <option key={page.id}>{page.title}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#9dabb9] pointer-events-none text-[20px]">
                                        arrow_drop_down
                                    </span>
                                </div>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-primary hover:bg-primary/80 rounded-lg text-sm text-white transition-colors whitespace-nowrap">
                                    <span>Save Changes</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#9dabb9] mb-1">
                                            Page Title <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            />
                                            <span
                                                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${formData.title.length <= 60 ? 'text-green-500' : 'text-red-500'
                                                    }`}
                                            >
                                                {formData.title.length}/60
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#586069] mt-1">Ideally between 50-60 characters.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#9dabb9] mb-1">URL Slug</label>
                                        <div className="flex items-center">
                                            <span className="bg-[#111418] border border-r-0 border-border-dark rounded-l-lg px-3 py-2 text-[#9dabb9] text-sm">
                                                /
                                            </span>
                                            <input
                                                className="flex-1 bg-[#283039] border border-border-dark rounded-r-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                placeholder="page-url-here"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#9dabb9] mb-1">
                                            Meta Description <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm resize-none h-20"
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            />
                                            <span
                                                className={`absolute right-3 bottom-2 text-xs font-bold ${formData.description.length <= 160 ? 'text-green-500' : 'text-red-500'
                                                    }`}
                                            >
                                                {formData.description.length}/160
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#586069] mt-1">Ideally between 120-160 characters.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-[#9dabb9] mb-1">Focus Keywords</label>
                                        <input
                                            className="w-full bg-[#283039] border border-border-dark rounded-lg px-3 py-2 text-white focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                                            type="text"
                                            value={formData.keywords}
                                            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                            placeholder="keyword1, keyword2, keyword3"
                                        />
                                        <p className="text-xs text-[#586069] mt-1">Separate keywords with commas.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pages List */}
                    <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                        <div className="bg-[#111418] border-b border-border-dark p-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-base">All Pages</h3>
                            <span className="text-[#9dabb9] text-sm">{samplePages.length} pages</span>
                        </div>
                        <div className="divide-y divide-border-dark">
                            {samplePages.map((page) => (
                                <div key={page.id} className="p-4 flex items-center justify-between hover:bg-[#283039]/30 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium text-sm">{page.title}</span>
                                        <span className="text-[#586069] text-xs">{page.url}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-lg font-bold ${getScoreColor(page.score)}`}>{page.score}</span>
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(page.status)}`}
                                        >
                                            {page.status}
                                        </span>
                                        <button className="text-[#9dabb9] hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Issues Sidebar */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                        <div className="bg-[#111418] border-b border-border-dark p-4">
                            <h3 className="text-white font-bold text-base flex items-center gap-2">
                                <span className="material-symbols-outlined text-yellow-500">bug_report</span>
                                SEO Issues
                            </h3>
                        </div>
                        <div className="divide-y divide-border-dark">
                            {sampleIssues.map((issue) => {
                                const issueStyle = getIssueIcon(issue.type);
                                return (
                                    <div key={issue.id} className="p-4 flex items-start gap-3 hover:bg-[#283039]/30 transition-colors">
                                        <div className={`size-8 rounded-lg flex items-center justify-center ${issueStyle.color}`}>
                                            <span className="material-symbols-outlined text-[18px]">{issueStyle.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-white text-sm">{issue.message}</p>
                                            <span className="text-[#586069] text-xs">{issue.pages} pages affected</span>
                                        </div>
                                        <button className="text-[#9dabb9] hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* SEO Score Ring */}
                    <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col items-center">
                        <h3 className="text-white font-bold text-base mb-4">Site Health</h3>
                        <div className="relative size-32">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="#283039" strokeWidth="8" />
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="45"
                                    fill="none"
                                    stroke="#0bda5b"
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${sampleStats.healthScore * 2.83} 283`}
                                    transform="rotate(-90 50 50)"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-3xl font-bold text-white">{sampleStats.healthScore}</span>
                            </div>
                        </div>
                        <p className="text-[#9dabb9] text-sm mt-4">Great! Your site is well optimized.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
