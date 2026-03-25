import type { Post } from '@/types';

export const blogTopics = [
    'All',
    'CI/CD',
    'Kubernetes',
    'Cloud Architecture',
    'Automation',
    'Security',
];

export const trendingTools = [
    {
        name: 'Kubernetes',
        shortName: 'K8',
        description: 'Orchestration',
        accentClassName:
            'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    },
    {
        name: 'GitLab',
        shortName: 'Gi',
        description: 'DevOps Platform',
        accentClassName:
            'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    },
    {
        name: 'Terraform',
        shortName: 'Tf',
        description: 'Infrastructure as Code',
        accentClassName:
            'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
    },
    {
        name: 'Ansible',
        shortName: 'An',
        description: 'Automation',
        accentClassName:
            'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    },
];

export const samplePosts: Post[] = [
    {
        id: '1',
        title: 'Automating your pipeline with GitHub Actions',
        slug: 'automating-pipeline-github-actions',
        excerpt:
            'Discover how to reduce deployment time by 50% using matrix builds and reusable workflows.',
        content: '',
        featuredImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBorMuWccEsO-365PD-J3ATEJq8PhpyU_A3oQjRX1bRo89MR3qecATcyBlzJfrlU7gvmdUVmrvYoZRlf6caYDPyJTI8YWDOEd4vbt39NM6A2MJwk8h6OMS07FoiPiz6xzq35_PXPXaXD6eAy03p1nFxYGlKmDP7fso1x1UfSYLyUWrph75ulp8rbWi9phwZ2VoNLu9jQOiF1sC8JZIsOQBa-nGWDa1FfBFjqjyLJ-h0MXOsHWMMMnqDS_hVJ1PAU7YjWx9UAPPG7u8c',
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
        excerpt:
            'An unbiased look at the two giants of Infrastructure as Code. We compare state management and language flexibility.',
        content: '',
        featuredImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuA4F9iNe06dKe-tVFawe2CIN6OxPhdjc5hLC2yraMyC1iRajPReJ-w2L0Cg1Q6Jj750I4wflumZtNKvynGBxxfsU4JQ4dC4kkqwmlvRh02Ub4uYttxxrg862hfHqYplJY9ob6bcq8P19AIcdiTpBKaI6tbzipU52-Gbo8UoDcXLvt2q6EFZkHpCwLPGJZiKIErdHj4x_hCq3x6OWh-QmEHJwu-wfrq0Z3lF-1QUScyl4fp3_qwOD5uwzRLSNXKEYPlJ5j1ShULLtSRX',
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
        excerpt:
            'Beyond Prometheus: Exploring the next generation of observability platforms for high-scale systems.',
        content: '',
        featuredImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxiiSONy7fUaMxtViA2bwq_WV0xaYU5j6g5fB8WYQ8bMJjPsmrURJdBNKOES74nL4kf7I6R00IhqvOCFiP8UbhRFJqo_vYdEGd_Ngg3Bw4oEKTaMTzLJIG8FPbVltawq3q_Bo0vGby5pjwRNXt6vA-mkpDSQhObJ0WB8LG6qTHL-dHYMizuSNjUaMJZtj3HEnxEJzMfwDbtfpQh4qapC9I-GYy2IuK2UFVsacdT19O9sFXeatn0m6OVmVHrPuslzJ4AZLpWDsTzbv',
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
        excerpt:
            'Best practices for image scanning, runtime security, and minimizing your attack surface.',
        content: '',
        featuredImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDbFges7BUsPGve6Xv_EhG2O984geMaKzrf5qECqixxR5c5_f89wn1iVARgC7EY6vXGtY41fqTCwwPt8e_DwBDLUVR3KHm5uupVIX5DhBIod01RI-2WMNsKLlRC7PTVuD8oevbLGahiNhXj0NxgSSAsXPmImm7rhNzu3uFf4RDuq3stZ9fMq2RsYClZ2o3kIr6zzIz6IMXlFGwAB_QQSe2afE0ALPgt_M6saXO9KajSgyEOx77RcCEYAD8QLvn3GIKevDvxTswqTmzz',
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
        excerpt:
            'Is multi-cloud worth the complexity? We analyze the cost and operational overhead for 2024.',
        content: '',
        featuredImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuCKj0jxge0pWMzD3SWtm2iUSvp3WiOW9ctEsvc7-J-nkBVJ6aOi3JjQuhLsE3dT7RVjO5fPmLSQODGQNS8xcgn8whjQLtVpV_ZyAdUeG1Us7dJERiPyD1gULx00IKXw7TqTGzr4SuMNVoh9df2KwAh-TNGDnjwVnrSPvPlAuou-Lu7E_QofXeKmFavQYEPCiOJWn2q7T2p2BL8NSlvkRIA8mKBkap2tGHPJmvvrvBT5AAcdnqlEYtOjJTXnlpzeVj593KyZjNwaoPQg',
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
        excerpt:
            '5 Python scripts every DevOps engineer should have in their toolkit for daily automation tasks.',
        content: '',
        featuredImage:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuA3IokKqazAADzH39LNESnkYxiwOfWAVK9Wvz59BWu_4cFC-3fEepOyBD0pmBRoNNJLuWH6Q--lgkxm1SWsQY_WAeVFQYoSNPdQ5CJYL9HFNunb5PzzS2yyat1uL2Kw90SIXHcSZQi3hVKGLvXN0TMfw0ZiWB1ehHMTBmMfR5T8AxaR2HjQyUwCDk2HSw5v9clGfz6EESA-FJfiPAG29UB3pqV8dWOzCHz1LuzRv8Ccb8zxscbC5_xcL7tDto0RkS2bcipbWFYGpCvh',
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
