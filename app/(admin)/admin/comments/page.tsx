'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Comment {
    id: string;
    content: string;
    status: string;
    authorName?: string;
    authorEmail?: string;
    authorIp?: string;
    createdAt: string;
    parentId?: string;
    user?: { id: string; firstName: string; lastName: string; avatar?: string };
    post?: { id: string; title: string };
}

const statusTabs = [
    { key: 'all', label: 'All Comments' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'SPAM', label: 'Spam' },
    { key: 'TRASH', label: 'Trash' },
];

function getStatusBadge(status: string) {
    switch (status) {
        case 'PENDING':
            return { icon: 'pending', bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', label: 'Pending' };
        case 'APPROVED':
            return { icon: 'check', bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', label: 'Approved' };
        case 'SPAM':
            return { icon: 'block', bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', label: 'Spam' };
        case 'TRASH':
            return { icon: 'delete', bg: 'bg-gray-500/10', text: 'text-gray-500', border: 'border-gray-500/20', label: 'Trash' };
        default:
            return { icon: 'help', bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', label: status };
    }
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const statCards = [
    { key: 'total', label: 'Total Comments', icon: 'chat_bubble', iconBg: 'bg-blue-500/10', iconColor: 'text-primary' },
    { key: 'pending', label: 'Pending', icon: 'pending', iconBg: 'bg-yellow-500/10', iconColor: 'text-yellow-500' },
    { key: 'approved', label: 'Approved', icon: 'check_circle', iconBg: 'bg-green-500/10', iconColor: 'text-green-500' },
    { key: 'spam', label: 'Spam', icon: 'report', iconBg: 'bg-red-500/10', iconColor: 'text-red-500' },
];

export default function CommentsPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, spam: 0 });

    // Fetch sample comments (API may need extension for admin)
    useEffect(() => {
        setLoading(true);
        // Simulated data - replace with real API when admin comments endpoint is available
        setTimeout(() => {
            setComments([
                {
                    id: '1', content: 'Great article! I\'ve been struggling with Network Policies for a while. One question: does the default deny policy affect the kube-system namespace?',
                    status: 'PENDING', authorName: 'John Doe', authorEmail: 'john.d@example.com', authorIp: '192.168.1.1',
                    createdAt: '2024-10-24T10:45:00Z', post: { id: '1', title: 'Mastering Kubernetes Network Policies' }
                },
                {
                    id: '2', content: 'Thanks for pointing that out! I\'ve updated the section on best practices to include namespace considerations.',
                    status: 'APPROVED', authorName: 'Sarah L.', authorEmail: 'sarah@blog.com', authorIp: '10.0.0.5',
                    createdAt: '2024-10-24T11:20:00Z', parentId: '1',
                    user: { id: '1', firstName: 'Sarah', lastName: 'L.', avatar: '' },
                    post: { id: '1', title: 'Mastering Kubernetes Network Policies' }
                },
                {
                    id: '3', content: 'Buy cheap watches here! Best price guaranteed click link now http://spam-link.com',
                    status: 'SPAM', authorName: 'Cheap Rolex', authorEmail: 'marketing@spam.com', authorIp: '45.23.11.90',
                    createdAt: '2024-10-23T02:15:00Z', post: { id: '2', title: 'Terraform Best Practices' }
                },
                {
                    id: '4', content: 'Can we get a follow-up article on how this integrates with Istio? That would be super helpful for our mesh setup.',
                    status: 'APPROVED', authorName: 'Mike K.', authorEmail: 'mike@dev.io', authorIp: '172.16.0.22',
                    createdAt: '2024-10-22T21:30:00Z', post: { id: '1', title: 'Mastering Kubernetes Network Policies' }
                },
            ]);
            setStats({ total: 1482, pending: 4, approved: 1412, spam: 66 });
            setLoading(false);
        }, 500);
    }, []);

    const filteredComments = activeTab === 'all' ? comments : comments.filter(c => c.status === activeTab);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await apiClient.patch(`/api/v1/comments/${id}/status`, { status });
            setComments(prev => prev.map(c => c.id === id ? { ...c, status } : c));
            toast.success(`Comment ${status.toLowerCase()}`);
        } catch {
            toast.error('Failed to update comment');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this comment permanently?')) return;
        try {
            await apiClient.delete(`/api/v1/comments/${id}`);
            setComments(prev => prev.filter(c => c.id !== id));
            toast.success('Comment deleted');
        } catch {
            toast.error('Failed to delete comment');
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((card) => (
                    <div key={card.key} className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                        <div className={`size-10 rounded-lg ${card.iconBg} flex items-center justify-center ${card.iconColor}`}>
                            <span className="material-symbols-outlined">{card.icon}</span>
                        </div>
                        <div>
                            <p className="text-[#9dabb9] text-xs font-medium uppercase">{card.label}</p>
                            <h3 className="text-white text-xl font-bold">
                                {stats[card.key as keyof typeof stats]?.toLocaleString() || 0}
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Comments Table */}
            <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col">
                {/* Tabs */}
                <div className="bg-[#111418] border-b border-border-dark p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-hide">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-[#9dabb9] hover:text-white hover:bg-[#283039]'
                                }`}
                            >
                                {tab.label}
                                {tab.key === 'PENDING' && stats.pending > 0 && (
                                    <span className="ml-1 bg-yellow-500/20 text-yellow-500 px-1.5 rounded text-[10px]">
                                        {stats.pending}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#18202a] border-b border-border-dark text-xs uppercase text-[#9dabb9] font-medium">
                                <th className="p-4 min-w-[200px]">Author</th>
                                <th className="p-4 min-w-[400px]">Comment</th>
                                <th className="p-4 min-w-[150px]">Article</th>
                                <th className="p-4 min-w-[120px]">Date</th>
                                <th className="p-4 text-right min-w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredComments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-[#9dabb9]">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">chat</span>
                                        No comments found
                                    </td>
                                </tr>
                            ) : (
                                filteredComments.map((comment) => {
                                    const badge = getStatusBadge(comment.status);
                                    const displayName = comment.user
                                        ? `${comment.user.firstName} ${comment.user.lastName}`
                                        : comment.authorName || 'Anonymous';
                                    const isSpam = comment.status === 'SPAM';

                                    return (
                                        <tr key={comment.id} className={`transition-colors group ${isSpam ? 'bg-red-500/5 hover:bg-red-500/10' : 'hover:bg-[#1f2937]'}`}>
                                            <td className="p-4 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className={`size-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                                        comment.user ? 'bg-primary/20 text-primary' : isSpam ? 'bg-gray-700' : 'bg-gradient-to-tr from-pink-500 to-purple-500'
                                                    }`}>
                                                        {isSpam ? (
                                                            <span className="material-symbols-outlined">person_off</span>
                                                        ) : (
                                                            getInitials(displayName)
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-sm">{displayName}</span>
                                                        {comment.user && (
                                                            <span className="bg-primary/20 text-primary text-[10px] font-bold px-1.5 rounded w-fit my-0.5">
                                                                AUTHOR
                                                            </span>
                                                        )}
                                                        {comment.authorEmail && (
                                                            <span className="text-[#9dabb9] text-xs">{comment.authorEmail}</span>
                                                        )}
                                                        {comment.authorIp && (
                                                            <span className="text-[#586069] text-[10px] mt-1 font-mono">{comment.authorIp}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="relative">
                                                    {comment.status === 'PENDING' && (
                                                        <div className="absolute -left-3 top-1 w-1 h-full bg-yellow-500/50 rounded-full" />
                                                    )}
                                                    <p className={`text-[#d1d5db] text-sm leading-relaxed mb-2 ${isSpam ? 'line-through opacity-60' : ''}`}>
                                                        {comment.content}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`inline-flex items-center gap-1 ${badge.bg} ${badge.text} text-[10px] font-bold px-2 py-0.5 rounded border ${badge.border}`}>
                                                            <span className="material-symbols-outlined text-[12px]">{badge.icon}</span>
                                                            {badge.label}
                                                        </span>
                                                        {comment.parentId && (
                                                            <span className="text-[#586069] text-[10px] flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-[12px]">subdirectory_arrow_right</span>
                                                                Reply
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                {comment.post && (
                                                    <span className="text-primary text-sm font-medium hover:underline cursor-pointer">
                                                        {comment.post.title}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <span className="text-[#9dabb9] text-sm">{formatDate(comment.createdAt)}</span>
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    {comment.status === 'PENDING' && (
                                                        <button onClick={() => handleUpdateStatus(comment.id, 'APPROVED')} className="p-1.5 rounded text-green-500 hover:bg-green-500/10 transition-colors" title="Approve">
                                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                        </button>
                                                    )}
                                                    {comment.status === 'APPROVED' && (
                                                        <button onClick={() => handleUpdateStatus(comment.id, 'PENDING')} className="p-1.5 rounded text-orange-400 hover:bg-orange-400/10 transition-colors" title="Unapprove">
                                                            <span className="material-symbols-outlined text-[20px]">close</span>
                                                        </button>
                                                    )}
                                                    {comment.status !== 'SPAM' && (
                                                        <button onClick={() => handleUpdateStatus(comment.id, 'SPAM')} className="p-1.5 rounded text-[#9dabb9] hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Mark as Spam">
                                                            <span className="material-symbols-outlined text-[20px]">report</span>
                                                        </button>
                                                    )}
                                                    {comment.status === 'SPAM' && (
                                                        <button onClick={() => handleUpdateStatus(comment.id, 'APPROVED')} className="p-1.5 rounded text-green-500 hover:bg-green-500/10 transition-colors" title="Not Spam">
                                                            <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDelete(comment.id)} className="p-1.5 rounded text-[#9dabb9] hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Delete">
                                                        <span className="material-symbols-outlined text-[20px]">{isSpam ? 'delete_forever' : 'delete'}</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
