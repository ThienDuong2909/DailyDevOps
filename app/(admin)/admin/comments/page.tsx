'use client';

import { useState } from 'react';

// Sample comments data - easily replaceable with API data
const sampleComments = [
    {
        id: '1',
        author: 'John Doe',
        email: 'john.d@example.com',
        ip: '192.168.1.1',
        avatar: null,
        initials: 'JD',
        avatarGradient: 'from-pink-500 to-purple-500',
        content: "Great article! I've been struggling with Network Policies for a while. One question: does the default deny policy affect the kube-system namespace?",
        status: 'PENDING',
        article: 'Mastering Kubernetes Network Policies',
        articleComments: 34,
        submittedAt: 'Oct 24, 2023',
        submittedTime: '10:45 AM',
    },
    {
        id: '2',
        author: 'Sarah L.',
        email: 'sarah@devopsblog.com',
        ip: '10.0.0.5',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnZCGrFGbf56yICttdpKRprUs_mwoAgImdoVlhbNKWHqRKW2e27qdhlrPimlZCwVIF-7V1G1a9zwlq4ZwdklZU8RUjUiTDl6bo_8yZBSVtDDE0hFslldpMjG7zKKB2ow3WE60B__RiO6y29cv9V_msqpeVKYhPA4eQ1mUPkS0WMWYOIkA-BAokhITO8h1TXcBUpdtxsC255HBYSOQaWpo3RP6EEfbgHkw89YcnwA4MHEG1uD_r2dFywFjjJvFazSj75LEBniC7C1Jm',
        initials: 'SL',
        avatarGradient: 'from-blue-500 to-cyan-500',
        content: 'Thanks for the feedback, John! The default deny policy only affects the namespace it is applied to. kube-system is excluded by default.',
        status: 'APPROVED',
        article: 'Mastering Kubernetes Network Policies',
        articleComments: 34,
        submittedAt: 'Oct 24, 2023',
        submittedTime: '11:30 AM',
    },
    {
        id: '3',
        author: 'Mike R.',
        email: 'mike@example.com',
        ip: '192.168.1.50',
        avatar: null,
        initials: 'MR',
        avatarGradient: 'from-green-500 to-emerald-500',
        content: 'CI/CD pipelines have really changed how we deploy. Would love to see more advanced patterns in a follow-up article.',
        status: 'APPROVED',
        article: 'CI/CD Pipeline Best Practices',
        articleComments: 18,
        submittedAt: 'Oct 23, 2023',
        submittedTime: '09:15 AM',
    },
    {
        id: '4',
        author: 'SpamBot',
        email: 'spam@fake.com',
        ip: '203.0.113.1',
        avatar: null,
        initials: 'SB',
        avatarGradient: 'from-red-500 to-orange-500',
        content: 'Buy cheap viagra online! Click here: http://spam.link',
        status: 'SPAM',
        article: 'Docker Security Hardening',
        articleComments: 12,
        submittedAt: 'Oct 22, 2023',
        submittedTime: '03:22 AM',
    },
    {
        id: '5',
        author: 'Alex Chen',
        email: 'alex@example.com',
        ip: '172.16.0.10',
        avatar: null,
        initials: 'AC',
        avatarGradient: 'from-yellow-500 to-amber-500',
        content: "I've struggled with VPA restarting pods unexpectedly. Do you have any tips for handling that in production environments?",
        status: 'PENDING',
        article: 'Kubernetes Autoscaling Guide',
        articleComments: 27,
        submittedAt: 'Oct 22, 2023',
        submittedTime: '02:45 PM',
    },
];

const sampleStats = {
    total: 1482,
    pending: 4,
    approved: 1412,
    spam: 66,
};

const tabs = ['All Comments', 'Pending', 'Approved', 'Spam', 'Trash'];

function getStatusBadge(status: string) {
    switch (status) {
        case 'PENDING':
            return {
                bg: 'bg-yellow-500/10',
                text: 'text-yellow-500',
                border: 'border-yellow-500/20',
                icon: 'pending',
                label: 'Pending',
                indicatorColor: 'bg-yellow-500/50',
            };
        case 'APPROVED':
            return {
                bg: 'bg-green-500/10',
                text: 'text-green-500',
                border: 'border-green-500/20',
                icon: 'check_circle',
                label: 'Approved',
                indicatorColor: 'bg-green-500/50',
            };
        case 'SPAM':
            return {
                bg: 'bg-red-500/10',
                text: 'text-red-500',
                border: 'border-red-500/20',
                icon: 'report',
                label: 'Spam',
                indicatorColor: 'bg-red-500/50',
            };
        default:
            return {
                bg: 'bg-gray-500/10',
                text: 'text-gray-500',
                border: 'border-gray-500/20',
                icon: 'help',
                label: status,
                indicatorColor: 'bg-gray-500/50',
            };
    }
}

export default function CommentsPage() {
    const [activeTab, setActiveTab] = useState('All Comments');
    const [selectedComments, setSelectedComments] = useState<string[]>([]);

    const filteredComments = sampleComments.filter((comment) => {
        if (activeTab === 'All Comments') return true;
        if (activeTab === 'Pending') return comment.status === 'PENDING';
        if (activeTab === 'Approved') return comment.status === 'APPROVED';
        if (activeTab === 'Spam') return comment.status === 'SPAM';
        return true;
    });

    const toggleSelectAll = () => {
        if (selectedComments.length === filteredComments.length) {
            setSelectedComments([]);
        } else {
            setSelectedComments(filteredComments.map((c) => c.id));
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">chat_bubble</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase">Total Comments</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.total.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-yellow-500/50 transition-colors group">
                    <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:text-yellow-400">
                        <span className="material-symbols-outlined">pending</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase group-hover:text-yellow-400">Pending</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.pending}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase">Approved</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.approved.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                        <span className="material-symbols-outlined">report</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium uppercase">Spam</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.spam}</h3>
                    </div>
                </div>
            </div>

            {/* Comments Table */}
            <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                {/* Tabs & Filters */}
                <div className="bg-[#111418] border-b border-border-dark p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
                        {tabs.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-[#9dabb9] hover:text-white hover:bg-[#283039]'
                                    }`}
                            >
                                {tab}
                                {tab === 'Pending' && (
                                    <span className="ml-1 bg-yellow-500/20 text-yellow-500 px-1.5 rounded text-[10px]">
                                        {sampleStats.pending}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative w-full sm:w-auto">
                            <select className="appearance-none bg-[#283039] border border-border-dark rounded-lg pl-3 pr-8 py-1.5 text-sm text-[#9dabb9] focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-48 cursor-pointer">
                                <option>Filter by Article</option>
                                <option>Kubernetes Network Policies</option>
                                <option>DevOps Culture Shift</option>
                                <option>Terraform Best Practices</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#9dabb9] pointer-events-none text-[20px]">
                                arrow_drop_down
                            </span>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#283039] hover:bg-[#3b4754] border border-border-dark rounded-lg text-sm text-[#9dabb9] hover:text-white transition-colors whitespace-nowrap">
                            <span className="material-symbols-outlined text-[18px]">filter_list</span>
                            <span>More Filters</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#18202a] border-b border-border-dark text-xs uppercase text-[#9dabb9] font-medium">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedComments.length === filteredComments.length && filteredComments.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 min-w-[200px]">Author</th>
                                <th className="p-4 min-w-[400px]">Comment</th>
                                <th className="p-4 min-w-[150px]">Associated Article</th>
                                <th className="p-4 min-w-[120px]">Submitted On</th>
                                <th className="p-4 text-right min-w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {filteredComments.map((comment) => {
                                const status = getStatusBadge(comment.status);
                                return (
                                    <tr key={comment.id} className="hover:bg-[#1f2937] transition-colors group">
                                        <td className="p-4 align-top pt-5">
                                            <input
                                                type="checkbox"
                                                checked={selectedComments.includes(comment.id)}
                                                onChange={() => {
                                                    setSelectedComments((prev) =>
                                                        prev.includes(comment.id)
                                                            ? prev.filter((id) => id !== comment.id)
                                                            : [...prev, comment.id]
                                                    );
                                                }}
                                                className="rounded border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="flex items-start gap-3">
                                                {comment.avatar ? (
                                                    <div
                                                        className="size-10 rounded-full bg-cover bg-center border border-border-dark"
                                                        style={{ backgroundImage: `url("${comment.avatar}")` }}
                                                    />
                                                ) : (
                                                    <div
                                                        className={`size-10 rounded-full bg-gradient-to-tr ${comment.avatarGradient} flex items-center justify-center text-white font-bold text-sm`}
                                                    >
                                                        {comment.initials}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold text-sm">{comment.author}</span>
                                                    <a
                                                        href={`mailto:${comment.email}`}
                                                        className="text-[#9dabb9] text-xs hover:text-primary transition-colors"
                                                    >
                                                        {comment.email}
                                                    </a>
                                                    <span className="text-[#586069] text-[10px] mt-1 font-mono">{comment.ip}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="relative">
                                                <div className={`absolute -left-3 top-1 w-1 h-full ${status.indicatorColor} rounded-full`} />
                                                <p className="text-[#d1d5db] text-sm leading-relaxed mb-2">{comment.content}</p>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1 ${status.bg} ${status.text} text-[10px] font-bold px-2 py-0.5 rounded border ${status.border}`}
                                                    >
                                                        <span className="material-symbols-outlined text-[12px]">{status.icon}</span>
                                                        {status.label}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <a href="#" className="text-primary hover:text-primary/80 text-sm font-medium hover:underline">
                                                {comment.article}
                                            </a>
                                            <div className="flex items-center gap-1 mt-1">
                                                <span className="bg-[#283039] text-[#9dabb9] text-[10px] px-1.5 rounded">
                                                    {comment.articleComments} comments
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <span className="text-[#9dabb9] text-sm">{comment.submittedAt}</span>
                                            <p className="text-[#586069] text-xs">at {comment.submittedTime}</p>
                                        </td>
                                        <td className="p-4 align-top text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="p-1.5 rounded text-green-500 hover:bg-green-500/10 transition-colors"
                                                    title="Approve"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                </button>
                                                <button
                                                    className="p-1.5 rounded text-[#9dabb9] hover:text-primary hover:bg-primary/10 transition-colors"
                                                    title="Reply"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">reply</span>
                                                </button>
                                                <button
                                                    className="p-1.5 rounded text-[#9dabb9] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                    title="Mark as Spam"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">report</span>
                                                </button>
                                                <button
                                                    className="p-1.5 rounded text-[#9dabb9] hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                    title="Delete"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="mt-auto p-4 border-t border-border-dark flex items-center justify-between">
                    <span className="text-[#9dabb9] text-sm">
                        Showing {filteredComments.length} of {sampleStats.total} comments
                    </span>
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-[#283039] text-[#9dabb9] hover:text-white hover:bg-[#3b4754] transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>
                        <span className="text-white text-sm font-medium px-3">1</span>
                        <button className="p-2 rounded-lg bg-[#283039] text-[#9dabb9] hover:text-white hover:bg-[#3b4754] transition-colors">
                            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
