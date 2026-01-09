'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PostCard } from '@/components/blog/post-card';
import { apiClient } from '@/lib/api';
import type { Post, Category, PaginatedResponse } from '@/types';

// Sample posts for when API is unavailable
const samplePosts: Post[] = [
    {
        id: '1',
        title: 'Automating your pipeline with GitHub Actions',
        slug: 'automating-pipeline-github-actions',
        excerpt: 'Discover how to reduce deployment time by 50% using matrix builds and reusable workflows.',
        content: '',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBorMuWccEsO-365PD-J3ATEJq8PhpyU_A3oQjRX1bRo89MR3qecATcyBlzJfrlU7gvmdUVmrvYoZRlf6caYDPyJTI8YWDOEd4vbt39NM6A2MJwk8h6OMS07FoiPiz6xzq35_PXPXaXD6eAy03p1nFxYGlKmDP7fso1x1UfSYLyUWrph75ulp8rbWi9phwZ2VoNLu9jQOiF1sC8JZIsOQBa-nGWDa1FfBFjqjyLJ-h0MXOsHWMMMnqDS_hVJ1PAU7YjWx9UAPPG7u8c',
        status: 'PUBLISHED',
        viewCount: 8920,
        readingTime: 5,
        publishedAt: '2024-10-24',
        createdAt: '2024-10-24',
        updatedAt: '2024-10-24',
        author: { id: '1', firstName: 'Sarah', lastName: 'L.', bio: '' },
        category: { id: '1', name: 'CI/CD', slug: 'cicd' },
        tags: [],
    },
    {
        id: '2',
        title: 'Terraform vs. Pulumi: What to choose?',
        slug: 'terraform-vs-pulumi',
        excerpt: 'An unbiased look at the two giants of Infrastructure as Code. We compare state management and language flexibility.',
        content: '',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4F9iNe06dKe-tVFawe2CIN6OxPhdjc5hLC2yraMyC1iRajPReJ-w2L0Cg1Q6Jj750I4wflumZtNKvynGBxxfsU4JQ4dC4kkqwmlvRh02Ub4uYttxxrg862hfHqYplJY9ob6bcq8P19AIcdiTpBKaI6tbzipU52-Gbo8UoDcXLvt2q6EFZkHpCwLPGJZiKIErdHj4x_hCq3x6OWh-QmEHJwu-wfrq0Z3lF-1QUScyl4fp3_qwOD5uwzRLSNXKEYPlJ5j1ShULLtSRX',
        status: 'PUBLISHED',
        viewCount: 5420,
        readingTime: 7,
        publishedAt: '2024-10-22',
        createdAt: '2024-10-22',
        updatedAt: '2024-10-22',
        author: { id: '1', firstName: 'Sarah', lastName: 'L.', bio: '' },
        category: { id: '2', name: 'IaC', slug: 'iac' },
        tags: [],
    },
    {
        id: '3',
        title: 'Top 5 Monitoring Tools for SREs',
        slug: 'top-5-monitoring-tools-sres',
        excerpt: 'Beyond Prometheus: Exploring the next generation of observability platforms for high-scale systems.',
        content: '',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxiiSONy7fUaMxtViA2bwq_WV0xaYU5j6g5fB8WYQ8bMJjPsmrURJdBNKOES74nL4kf7I6R00IhqvOCFiP8UbhRFJqo_vYdEGd_Ngg3Bw4oEKTaMTzLJIG8FPbVltawq3q_Bo0vGby5pjwRNXt6vA-mkpDSQhObJ0WB8LG6qTHL-dHYMizuSNjUaMJZtj3HEnxEJzMfwDbtfpQh4qapC9I-GYy2IuK2UFVsacdT19O9sFXeatn0m6OVmVHrPuslzJ4AZLpWDsTzbv',
        status: 'PUBLISHED',
        viewCount: 3210,
        readingTime: 4,
        publishedAt: '2024-10-20',
        createdAt: '2024-10-20',
        updatedAt: '2024-10-20',
        author: { id: '1', firstName: 'Sarah', lastName: 'L.', bio: '' },
        category: { id: '3', name: 'Observability', slug: 'observability' },
        tags: [],
    },
    {
        id: '4',
        title: 'Securing Your Docker Containers',
        slug: 'securing-docker-containers',
        excerpt: 'Best practices for image scanning, runtime security, and minimizing your attack surface.',
        content: '',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDbFges7BUsPGve6Xv_EhG2O984geMaKzrf5qECqixxR5c5_f89wn1iVARgC7EY6vXGtY41fqTCwwPt8e_DwBDLUVR3KHm5uupVIX5DhBIod01RI-2WMNsKLlRC7PTVuD8oevbLGahiNhXj0NxgSSAsXPmImm7rhNzu3uFf4RDuq3stZ9fMq2RsYClZ2o3kIr6zzIz6IMXlFGwAB_QQSe2afE0ALPgt_M6saXO9KajSgyEOx77RcCEYAD8QLvn3GIKevDvxTswqTmzz',
        status: 'PUBLISHED',
        viewCount: 2150,
        readingTime: 6,
        publishedAt: '2024-10-18',
        createdAt: '2024-10-18',
        updatedAt: '2024-10-18',
        author: { id: '1', firstName: 'Sarah', lastName: 'L.', bio: '' },
        category: { id: '4', name: 'Security', slug: 'security' },
        tags: [],
    },
    {
        id: '5',
        title: 'Multi-Cloud Strategy: A Reality Check',
        slug: 'multi-cloud-strategy',
        excerpt: 'Is multi-cloud worth the complexity? We analyze the cost and operational overhead for 2024.',
        content: '',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKj0jxge0pWMzD3SWtm2iUSvp3WiOW9ctEsvc7-J-nkBVJ6aOi3JjQuhLsE3dT7RVjO5fPmLSQODGQNS8xcgn8whjQLtVpV_ZyAdUeG1Us7dJERiPyD1gULx00IKXw7TqTGzr4SuMNVoh9df2KwAh-TNGDnjwVnrSPvPlAuou-Lu7E_QofXeKmFavQYEPCiOJWn2q7T2p2BL8NSlvkRIA8mKBkap2tGHPJmvvrvBT5AAcdnqlEYtOjJTXnlpzeVj593KyZjNwaoPQg',
        status: 'PUBLISHED',
        viewCount: 1890,
        readingTime: 10,
        publishedAt: '2024-10-15',
        createdAt: '2024-10-15',
        updatedAt: '2024-10-15',
        author: { id: '1', firstName: 'Sarah', lastName: 'L.', bio: '' },
        category: { id: '5', name: 'Cloud', slug: 'cloud' },
        tags: [],
    },
    {
        id: '6',
        title: 'Python for DevOps: Essential Scripts',
        slug: 'python-devops-scripts',
        excerpt: '5 Python scripts every DevOps engineer should have in their toolkit for daily automation tasks.',
        content: '',
        featuredImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3IokKqazAADzH39LNESnkYxiwOfWAVK9Wvz59BWu_4cFC-3fEepOyBD0pmBRoNNJLuWH6Q--lgkxm1SWsQY_WAeVFQYoSNPdQ5CJYL9HFNunb5PzzS2yyat1uL2Kw90SIXHcSZQi3hVKGLvXN0TMfw0ZiWB1ehHMTBmMfR5T8AxaR2HjQyUwCDk2HSw5v9clGfz6EESA-FJfiPAG29UB3pqV8dWOzCHz1LuzRv8Ccb8zxscbC5_xcL7tDto0RkS2bcipbWFYGpCvh',
        status: 'PUBLISHED',
        viewCount: 1540,
        readingTime: 6,
        publishedAt: '2024-10-12',
        createdAt: '2024-10-12',
        updatedAt: '2024-10-12',
        author: { id: '1', firstName: 'Sarah', lastName: 'L.', bio: '' },
        category: { id: '6', name: 'Automation', slug: 'automation' },
        tags: [],
    },
];

const categories = ['All', 'CI/CD', 'Kubernetes', 'Cloud Architecture', 'Automation', 'Security'];

export default function BlogHomePage() {
    const [posts, setPosts] = useState<Post[]>(samplePosts);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const response = await apiClient.get<PaginatedResponse<Post>>('/api/v1/posts/published?limit=6');
                if (response.data && response.data.length > 0) {
                    setPosts(response.data);
                }
            } catch (error) {
                console.log('Using sample data');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    return (
        <div className="w-full max-w-[1280px] flex flex-col gap-8">
            {/* Hero Section */}
            <section className="@container w-full">
                <div className="flex flex-col-reverse md:flex-row gap-6 md:gap-10 items-center bg-surface-light dark:bg-surface-dark rounded-2xl p-6 md:p-8 lg:p-10 border border-gray-100 dark:border-gray-800 shadow-sm">
                    {/* Text Content */}
                    <div className="flex flex-col gap-4 md:w-1/2 items-start justify-center">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wide">
                            <span className="material-symbols-outlined !text-[16px]">verified</span>
                            Featured Article
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-text-main dark:text-white leading-tight tracking-[-0.033em]">
                            Mastering Kubernetes: A Guide for 2024
                        </h1>
                        <p className="text-text-sub dark:text-gray-400 text-base md:text-lg leading-relaxed">
                            Learn the orchestration secrets that will scale your infrastructure efficiently and
                            reliably. We dive deep into new scheduling algorithms and security patterns.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <Link
                                href="/blog/mastering-kubernetes-autoscaling-2024"
                                className="flex items-center justify-center rounded-lg h-12 px-6 bg-primary hover:bg-primary-dark text-white text-base font-bold shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"
                            >
                                Read Article
                            </Link>
                            <span className="text-sm text-text-sub">8 min read</span>
                        </div>
                    </div>
                    {/* Image */}
                    <div className="w-full md:w-1/2 aspect-video md:aspect-[4/3] lg:aspect-video rounded-xl overflow-hidden shadow-lg">
                        <div
                            className="w-full h-full bg-cover bg-center hover:scale-105 transition-transform duration-700"
                            style={{
                                backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCSD2g46KGqb9cGeS82Ec7BfIxg_KbzsZai-Dqyp-kXF22UR6X4yO0_enwCDCa6jSILQkNRhrO-qbNfP28DSjYc3R-LPS8-G-L8OGHYObrLWkSLfIiiV9yuXcIe7RlEshs58ng5Wca4SMVAxh_1KNrYC5g9xvgBqPF7DnBymxGSne4D6OEwRIOQbNEoCDnm6rRwENW4otkn5gG2aladZ8NgWhva1deiWykR5JBCyTbXzvA6UWwzb2W30j-hur9RiZ5z9FuU2mx2CaH1")`,
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Category Chips (Filters) */}
            <section className="flex flex-wrap gap-3 py-2 items-center">
                <span className="text-sm font-semibold text-text-sub mr-2">Topics:</span>
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`flex h-9 items-center justify-center px-4 rounded-full text-sm font-medium transition-all active:scale-95 ${selectedCategory === category
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-text-main dark:text-gray-300 hover:border-primary hover:text-primary'
                            }`}
                    >
                        {category}
                    </button>
                ))}
            </section>

            {/* Content Grid Area */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Articles Grid */}
                <div className="flex-1">
                    {/* Section Header */}
                    <div className="flex items-center justify-between pb-6">
                        <h2 className="text-2xl font-bold text-text-main dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">feed</span>
                            Recent Posts
                        </h2>
                        <Link
                            href="/blog/all"
                            className="text-sm font-medium text-primary hover:text-primary-dark hover:underline"
                        >
                            View All
                        </Link>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {posts.map((post) => (
                                <PostCard key={post.id} post={post} />
                            ))}
                        </div>
                    )}

                    {/* Load More */}
                    <div className="flex justify-center pt-10">
                        <button className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 text-text-main dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            Load More Articles
                            <span className="material-symbols-outlined !text-[20px]">expand_more</span>
                        </button>
                    </div>
                </div>

                {/* Sidebar (Desktop Only) */}
                <aside className="hidden lg:flex flex-col w-80 shrink-0 gap-8">
                    {/* Popular Tools Widget */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm sticky top-24">
                        <h3 className="text-lg font-bold mb-4 text-text-main dark:text-white">Trending Tools</h3>
                        <div className="flex flex-col gap-4">
                            <Link href="#" className="flex items-center gap-3 group">
                                <div className="size-10 rounded bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary font-bold">
                                    K8
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary">
                                        Kubernetes
                                    </span>
                                    <span className="text-xs text-text-sub">Orchestration</span>
                                </div>
                            </Link>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
                            <Link href="#" className="flex items-center gap-3 group">
                                <div className="size-10 rounded bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold">
                                    Gi
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary">
                                        GitLab
                                    </span>
                                    <span className="text-xs text-text-sub">DevOps Platform</span>
                                </div>
                            </Link>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
                            <Link href="#" className="flex items-center gap-3 group">
                                <div className="size-10 rounded bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 font-bold">
                                    Tf
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary">
                                        Terraform
                                    </span>
                                    <span className="text-xs text-text-sub">IaC</span>
                                </div>
                            </Link>
                            <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
                            <Link href="#" className="flex items-center gap-3 group">
                                <div className="size-10 rounded bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 font-bold">
                                    An
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-text-main dark:text-white group-hover:text-primary">
                                        Ansible
                                    </span>
                                    <span className="text-xs text-text-sub">Automation</span>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Ad / Promo Placeholder */}
                    <div className="bg-primary/5 rounded-xl p-6 border border-primary/10 text-center">
                        <span className="material-symbols-outlined text-primary !text-4xl mb-3">rocket_launch</span>
                        <h3 className="text-base font-bold text-text-main dark:text-white mb-2">Deploy Faster</h3>
                        <p className="text-sm text-text-sub mb-4">Try our new cloud benchmark tool for free.</p>
                        <button className="w-full py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-primary font-bold text-sm rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            Start Now
                        </button>
                    </div>
                </aside>
            </div>

            {/* Newsletter Section */}
            <section className="w-full mt-8 rounded-2xl bg-gradient-to-r from-primary to-blue-500 overflow-hidden relative shadow-lg">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuCuXF0VgbeGaIe_yKVopmVCCEBTsq8p0anyE10DE-GLlyW7nOzfRZD0eG-o1lIqe4YMwf5wnW4fo8PqwABfl9Rp_AnM0tXxjvgyR38MJW7qpK1Ax2VgTEQldvugZaMd-Q7j6TsI2I2DBEqBkrDM_omVuu14mGs9mXYf_r5fTj3APZtAg3pfogweKJIfRXLFhzOMd6ifGx1gsHyO9g9Vzcvks5AW7BnarcN87Ggmsfvz3wI4fRarS0SmHXUFmtamr6zlU-zEzHnvFoTa")`,
                    }}
                />
                <div className="relative flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-6">
                    <div className="flex flex-col gap-2 md:w-1/2 text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                            Stay in the loop
                        </h2>
                        <p className="text-blue-100 text-sm md:text-base">
                            Join 10,000+ DevOps engineers. Get weekly tips, tutorials, and tools delivered to your inbox.
                        </p>
                    </div>
                    <div className="w-full md:w-auto flex-1 max-w-md">
                        <form className="flex flex-col sm:flex-row gap-2">
                            <input
                                className="flex-1 px-4 py-3 rounded-lg border-0 focus:ring-2 focus:ring-white/50 text-text-main outline-none"
                                placeholder="Enter your email"
                                required
                                type="email"
                            />
                            <button
                                className="px-6 py-3 bg-surface-dark text-white font-bold rounded-lg hover:bg-gray-900 transition-colors shadow-lg"
                                type="submit"
                            >
                                Subscribe
                            </button>
                        </form>
                        <p className="text-xs text-blue-100 mt-2 text-center md:text-left opacity-80">
                            No spam, unsubscribe anytime.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
