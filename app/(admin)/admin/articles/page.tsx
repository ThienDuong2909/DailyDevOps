'use client';

import { useState } from 'react';
import Link from 'next/link';

// ==============================================
// TYPE DEFINITIONS
// ==============================================

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    author: {
        name: string;
        avatar: string;
    };
    category: string;
    status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'ARCHIVED';
    views: number;
    comments: number;
    publishedAt: string;
    updatedAt: string;
    featuredImage: string;
}

// ==============================================
// SAMPLE DATA - Replace with API data
// ==============================================

const sampleArticles: Article[] = [
    {
        id: '1',
        title: 'Mastering Kubernetes Network Policies',
        slug: 'mastering-k8s-network-policies',
        excerpt: 'Learn how to secure your Kubernetes cluster networking using Network Policies...',
        author: {
            name: 'Sarah L.',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnZCGrFGbf56yICttdpKRprUs_mwoAgImdoVlhbNKWHqRKW2e27qdhlrPimlZCwVIF-7V1G1a9zwlq4ZwdklZU8RUjUiTDl6bo_8yZBSVtDDE0hFslldpMjG7zKKB2ow3WE60B__RiO6y29cv9V_msqpeVKYhPA4eQ1mUPkS0WMWYOIkA-BAokhITO8h1TXcBUpdtxsC255HBYSOQaWpo3RP6EEfbgHkw89YcnwA4MHEG1uD_r2dFywFjjJvFazSj75LEBniC7C1Jm',
        },
        category: 'Kubernetes',
        status: 'PUBLISHED',
        views: 12405,
        comments: 34,
        publishedAt: 'Oct 24, 2023',
        updatedAt: '2 hours ago',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjEysfTyZ26PBX00Mx5FFP2GgQRsdNrPg8sJsdQ22KmvBSGAM7oMMbGZnrssdVDysi-UmYHyE1mOBADvOky1iW_8XrD6CHzoOx68FhljxVlFeDkc_I4d_4tGEoDeOqcZ54UmhRLnt7ImMZa-OZ18uoN4DCzxXO2_h4RpK7MKwGXxXbHQoGTJFDmeFfvYAbOD9zLB1gizkpnQ7VSvTm016qCwhUAZ9RJpN-UlABamA0Vdjj7lvRhLIL5BmBCMbeF9Z359osv4QaMSE2',
    },
    {
        id: '2',
        title: 'CI/CD Pipeline Best Practices for 2024',
        slug: 'cicd-best-practices-2024',
        excerpt: 'Discover the latest strategies for building efficient CI/CD pipelines...',
        author: {
            name: 'Mike R.',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8_5VEGoMEkoBd2TLyY-qDhLB9bNFIFrvlEn2xusfrKZGABnfe-HfHMrSoTzIZWHA_DvYkF7auOEs4knWmgYas-saCZm06BxZsOkO_d7T-m5aYpPdwAIVDn833q_ekX0M3YDFTCnQtUOvzInLL0ADVPpfejfzy37j4ZIQVjQB7FfgaQTkniwbcKe3RfstsAkNf9bdzhYkYckTQ1atbK0-_Ve2ZFwlgAmqzcMQ3dOTCmPRRozVSMyd7USjSwU-EHeVV3Wb2jRlTh27R',
        },
        category: 'CI/CD',
        status: 'DRAFT',
        views: 0,
        comments: 0,
        publishedAt: '-',
        updatedAt: '5 mins ago',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBorMuWccEsO-365PD-J3ATEJq8PhpyU_A3oQjRX1bRo89MR3qecATcyBlzJfrlU7gvmdUVmrvYoZRlf6caYDPyJTI8YWDOEd4vbt39NM6A2MJwk8h6OMS07FoiPiz6xzq35_PXPXaXD6eAy03p1nFxYGlKmDP7fso1x1UfSYLyUWrph75ulp8rbWi9phwZ2VoNLu9jQOiF1sC8JZIsOQBa-nGWDa1FfBFjqjyLJ-h0MXOsHWMMMnqDS_hVJ1PAU7YjWx9UAPPG7u8c',
    },
    {
        id: '3',
        title: 'Docker Security Hardening Guide',
        slug: 'docker-security-hardening',
        excerpt: 'Best practices for securing your Docker containers in production...',
        author: {
            name: 'Sarah L.',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnZCGrFGbf56yICttdpKRprUs_mwoAgImdoVlhbNKWHqRKW2e27qdhlrPimlZCwVIF-7V1G1a9zwlq4ZwdklZU8RUjUiTDl6bo_8yZBSVtDDE0hFslldpMjG7zKKB2ow3WE60B__RiO6y29cv9V_msqpeVKYhPA4eQ1mUPkS0WMWYOIkA-BAokhITO8h1TXcBUpdtxsC255HBYSOQaWpo3RP6EEfbgHkw89YcnwA4MHEG1uD_r2dFywFjjJvFazSj75LEBniC7C1Jm',
        },
        category: 'Security',
        status: 'PUBLISHED',
        views: 8234,
        comments: 18,
        publishedAt: 'Oct 22, 2023',
        updatedAt: '1 day ago',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbFges7BUsPGve6Xv_EhG2O984geMaKzrf5qECqixxR5c5_f89wn1iVARgC7EY6vXGtY41fqTCwwPt8e_DwBDLUVR3KHm5uupVIX5DhBIod01RI-2WMNsKLlRC7PTVuD8oevbLGahiNhXj0NxgSSAsXPmImm7rhNzu3uFf4RDuq3stZ9fMq2RsYClZ2o3kIr6zzIz6IMXlFGwAB_QQSe2afE0ALPgt_M6saXO9KajSgyEOx77RcCEYAD8QLvn3GIKevDvxTswqTmzz',
    },
    {
        id: '4',
        title: 'Terraform vs Pulumi: Infrastructure as Code Comparison',
        slug: 'terraform-vs-pulumi',
        excerpt: 'A comprehensive comparison of two popular IaC tools...',
        author: {
            name: 'Alex Chen',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBo4tWoLcSoqXUxBW8uZNd5ovAGPWC4bD6oVyIgoFGSW9zceRwokNjTJ4ixebB6Fu0BPQjYvM60JUGmIEjjf8XvsOG6UC0cQEaGAv9IVVYf5xV-EzSuXIwdQwKBJKDz7ECbctercDATvskWp1zm_sL1cZ5zZjUAbuLSCRYfxJihUQG910n_xbArMkMwsX7EELiPJM2OawhgNFdb5y2A7TaenLJNU7hFLocrYAmzDcYCIU8KEXemhL84Ohec3ZeE6KmFSKk63Op-ZcBt',
        },
        category: 'IaC',
        status: 'SCHEDULED',
        views: 0,
        comments: 0,
        publishedAt: 'Nov 1, 2023',
        updatedAt: '3 days ago',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4F9iNe06dKe-tVFawe2CIN6OxPhdjc5hLC2yraMyC1iRajPReJ-w2L0Cg1Q6Jj750I4wflumZtNKvynGBxxfsU4JQ4dC4kkqwmlvRh02Ub4uYttxxrg862hfHqYplJY9ob6bcq8P19AIcdiTpBKaI6tbzipU52-Gbo8UoDcXLvt2q6EFZkHpCwLPGJZiKIErdHj4x_hCq3x6OWh-QmEHJwu-wfrq0Z3lF-1QUScyl4fp3_qwOD5uwzRLSNXKEYPlJ5j1ShULLtSRX',
    },
    {
        id: '5',
        title: 'Monitoring Kubernetes with Prometheus',
        slug: 'monitoring-k8s-prometheus',
        excerpt: 'Complete guide to setting up Prometheus for Kubernetes monitoring...',
        author: {
            name: 'Sarah L.',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAnZCGrFGbf56yICttdpKRprUs_mwoAgImdoVlhbNKWHqRKW2e27qdhlrPimlZCwVIF-7V1G1a9zwlq4ZwdklZU8RUjUiTDl6bo_8yZBSVtDDE0hFslldpMjG7zKKB2ow3WE60B__RiO6y29cv9V_msqpeVKYhPA4eQ1mUPkS0WMWYOIkA-BAokhITO8h1TXcBUpdtxsC255HBYSOQaWpo3RP6EEfbgHkw89YcnwA4MHEG1uD_r2dFywFjjJvFazSj75LEBniC7C1Jm',
        },
        category: 'Observability',
        status: 'ARCHIVED',
        views: 15620,
        comments: 42,
        publishedAt: 'Sep 15, 2023',
        updatedAt: '2 weeks ago',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxiiSONy7fUaMxtViA2bwq_WV0xaYU5j6g5fB8WYQ8bMJjPsmrURJdBNKOES74nL4kf7I6R00IhqvOCFiP8UbhRFJqo_vYdEGd_Ngg3Bw4oEKTaMTzLJIG8FPbVltawq3q_Bo0vGby5pjwRNXt6vA-mkpDSQhObJ0WB8LG6qTHL-dHYMizuSNjUaMJZtj3HEnxEJzMfwDbtfpQh4qapC9I-GYy2IuK2UFVsacdT19O9sFXeatn0m6OVmVHrPuslzJ4AZLpWDsTzbv',
    },
];

const sampleStats = {
    total: 156,
    published: 89,
    draft: 42,
    scheduled: 12,
    archived: 13,
};

const tabs = ['All Articles', 'Published', 'Drafts', 'Scheduled', 'Archived'];
const categories = ['All Categories', 'Kubernetes', 'CI/CD', 'Security', 'IaC', 'Observability', 'Cloud Native'];

// ==============================================
// HELPER FUNCTIONS
// ==============================================

function getStatusBadge(status: Article['status']) {
    switch (status) {
        case 'PUBLISHED':
            return {
                bg: 'bg-green-900/30',
                text: 'text-green-400',
                border: 'border-green-900',
                label: 'Published',
                icon: 'check_circle',
            };
        case 'DRAFT':
            return {
                bg: 'bg-yellow-900/30',
                text: 'text-yellow-400',
                border: 'border-yellow-900',
                label: 'Draft',
                icon: 'edit_note',
            };
        case 'SCHEDULED':
            return {
                bg: 'bg-blue-900/30',
                text: 'text-blue-400',
                border: 'border-blue-900',
                label: 'Scheduled',
                icon: 'schedule',
            };
        case 'ARCHIVED':
            return {
                bg: 'bg-gray-900/30',
                text: 'text-gray-400',
                border: 'border-gray-700',
                label: 'Archived',
                icon: 'inventory_2',
            };
        default:
            return {
                bg: 'bg-gray-900/30',
                text: 'text-gray-400',
                border: 'border-gray-700',
                label: status,
                icon: 'help',
            };
    }
}

function formatViews(views: number): string {
    if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'k';
    }
    return views.toString();
}

// ==============================================
// MAIN COMPONENT
// ==============================================

export default function ArticlesPage() {
    const [activeTab, setActiveTab] = useState('All Articles');
    const [selectedCategory, setSelectedCategory] = useState('All Categories');
    const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter articles based on tab and category
    const filteredArticles = sampleArticles.filter((article) => {
        // Tab filter
        if (activeTab === 'Published' && article.status !== 'PUBLISHED') return false;
        if (activeTab === 'Drafts' && article.status !== 'DRAFT') return false;
        if (activeTab === 'Scheduled' && article.status !== 'SCHEDULED') return false;
        if (activeTab === 'Archived' && article.status !== 'ARCHIVED') return false;

        // Category filter
        if (selectedCategory !== 'All Categories' && article.category !== selectedCategory) return false;

        // Search filter
        if (searchQuery && !article.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        return true;
    });

    const toggleSelectAll = () => {
        if (selectedArticles.length === filteredArticles.length) {
            setSelectedArticles([]);
        } else {
            setSelectedArticles(filteredArticles.map((a) => a.id));
        }
    };

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3 hover:border-primary/50 transition-colors">
                    <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">article</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium">Total</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.total}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3 hover:border-green-500/50 transition-colors cursor-pointer" onClick={() => setActiveTab('Published')}>
                    <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                        <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium">Published</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.published}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3 hover:border-yellow-500/50 transition-colors cursor-pointer" onClick={() => setActiveTab('Drafts')}>
                    <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                        <span className="material-symbols-outlined">edit_note</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium">Drafts</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.draft}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3 hover:border-blue-500/50 transition-colors cursor-pointer" onClick={() => setActiveTab('Scheduled')}>
                    <div className="size-10 rounded-lg bg-blue-400/10 flex items-center justify-center text-blue-400">
                        <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium">Scheduled</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.scheduled}</h3>
                    </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex items-center gap-3 hover:border-gray-500/50 transition-colors cursor-pointer" onClick={() => setActiveTab('Archived')}>
                    <div className="size-10 rounded-lg bg-gray-500/10 flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                    <div>
                        <p className="text-[#9dabb9] text-xs font-medium">Archived</p>
                        <h3 className="text-white text-xl font-bold">{sampleStats.archived}</h3>
                    </div>
                </div>
            </div>

            {/* Articles Table */}
            <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[600px]">
                {/* Header with Tabs and Actions */}
                <div className="bg-[#111418] border-b border-border-dark p-4 flex flex-col gap-4">
                    {/* Tabs Row */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-[#9dabb9] hover:text-white hover:bg-[#283039]'
                                        }`}
                                >
                                    {tab}
                                    {tab === 'Drafts' && sampleStats.draft > 0 && (
                                        <span className="ml-2 bg-yellow-500/20 text-yellow-500 px-1.5 rounded text-[10px]">
                                            {sampleStats.draft}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        <Link
                            href="/admin/articles/new"
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            New Article
                        </Link>
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px] max-w-md">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#9dabb9] text-[20px]">
                                search
                            </span>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles..."
                                className="w-full bg-[#283039] border border-border-dark rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-[#586069]"
                            />
                        </div>

                        {/* Category Filter */}
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none bg-[#283039] border border-border-dark rounded-lg pl-3 pr-10 py-2 text-sm text-[#9dabb9] focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                {categories.map((cat) => (
                                    <option key={cat}>{cat}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#9dabb9] pointer-events-none text-[18px]">
                                arrow_drop_down
                            </span>
                        </div>

                        {/* Bulk Actions */}
                        {selectedArticles.length > 0 && (
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="text-xs text-[#9dabb9]">{selectedArticles.length} selected</span>
                                <button className="flex items-center gap-1 px-3 py-1.5 bg-[#283039] hover:bg-[#3b4754] border border-border-dark rounded-lg text-sm text-[#9dabb9] hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#18202a] border-b border-border-dark text-xs uppercase text-[#9dabb9] font-medium">
                                <th className="p-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                                <th className="p-4 min-w-[350px]">Article</th>
                                <th className="p-4 min-w-[120px]">Author</th>
                                <th className="p-4 min-w-[100px]">Category</th>
                                <th className="p-4 min-w-[100px]">Status</th>
                                <th className="p-4 min-w-[80px]">Views</th>
                                <th className="p-4 min-w-[120px]">Updated</th>
                                <th className="p-4 text-right min-w-[100px]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-dark">
                            {filteredArticles.map((article) => {
                                const status = getStatusBadge(article.status);
                                return (
                                    <tr key={article.id} className="hover:bg-[#1f2937] transition-colors group">
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedArticles.includes(article.id)}
                                                onChange={() => {
                                                    setSelectedArticles((prev) =>
                                                        prev.includes(article.id)
                                                            ? prev.filter((id) => id !== article.id)
                                                            : [...prev, article.id]
                                                    );
                                                }}
                                                className="rounded border-border-dark bg-[#283039] text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="size-16 rounded-lg bg-cover bg-center flex-shrink-0 border border-border-dark"
                                                    style={{ backgroundImage: `url("${article.featuredImage}")` }}
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <Link
                                                        href={`/admin/articles/${article.id}`}
                                                        className="text-white font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                                                    >
                                                        {article.title}
                                                    </Link>
                                                    <span className="text-[#586069] text-xs font-mono">/{article.slug}</span>
                                                    <p className="text-[#9dabb9] text-xs mt-1 line-clamp-1">{article.excerpt}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="size-6 rounded-full bg-cover bg-center border border-border-dark"
                                                    style={{ backgroundImage: `url("${article.author.avatar}")` }}
                                                />
                                                <span className="text-white text-sm">{article.author.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-[#283039] text-[#9dabb9] text-xs px-2 py-1 rounded">
                                                {article.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg} ${status.text} ${status.border}`}
                                            >
                                                <span className="material-symbols-outlined text-[12px]">{status.icon}</span>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-sm text-[#9dabb9]">
                                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                {formatViews(article.views)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-[#9dabb9] text-sm">{article.updatedAt}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/admin/articles/${article.id}`}
                                                    className="p-1.5 rounded text-[#9dabb9] hover:text-primary hover:bg-primary/10 transition-colors"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </Link>
                                                <button
                                                    className="p-1.5 rounded text-[#9dabb9] hover:text-white hover:bg-[#283039] transition-colors"
                                                    title="Preview"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                                <button
                                                    className="p-1.5 rounded text-[#9dabb9] hover:text-red-400 hover:bg-red-400/10 transition-colors"
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

                    {filteredArticles.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="material-symbols-outlined text-[#586069] text-5xl mb-4">article</span>
                            <h3 className="text-white font-bold text-lg mb-2">No articles found</h3>
                            <p className="text-[#9dabb9] text-sm">Try adjusting your filters or create a new article.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-auto p-4 border-t border-border-dark flex items-center justify-between">
                    <span className="text-[#9dabb9] text-sm">
                        Showing {filteredArticles.length} of {sampleStats.total} articles
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
