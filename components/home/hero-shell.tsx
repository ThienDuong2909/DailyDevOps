import Link from 'next/link';
import { ArrowRight, BarChart3, LockKeyhole, Terminal } from 'lucide-react';

const stackBadges = [
    'Next.js 14',
    'Express API',
    'Prisma',
    'MySQL',
    'Tailwind CSS',
];

const focusAreas = [
    {
        title: 'Delivery Pipelines',
        description: 'CI/CD guides, reusable workflows and release automation.',
        icon: Terminal,
    },
    {
        title: 'Platform Reliability',
        description: 'Monitoring, observability and feedback loops for production.',
        icon: BarChart3,
    },
    {
        title: 'Security by Default',
        description: 'Container hardening, access control and operational hygiene.',
        icon: LockKeyhole,
    },
];

export function HeroShell() {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                <section className="space-y-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-400">
                        <Terminal className="size-4" />
                        DevOps Blog
                    </div>
                    <div className="space-y-4">
                        <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-[-0.05em] text-white md:text-6xl">
                            Editorial blog for delivery, reliability and cloud
                            operations.
                        </h1>
                        <p className="max-w-2xl text-base leading-8 text-slate-400 md:text-lg">
                            A production-minded knowledge base for DevOps
                            engineers, SREs and cloud teams building with
                            automation, observability and secure delivery.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <Link
                            href="/blog"
                            className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
                        >
                            Open Blog
                            <ArrowRight className="size-4" />
                        </Link>
                        <Link
                            href="/admin"
                            className="inline-flex h-12 items-center rounded-xl border border-slate-700 px-5 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-500 hover:text-cyan-400"
                        >
                            Admin Workspace
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-4">
                        {stackBadges.map((badge) => (
                            <span
                                key={badge}
                                className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs font-medium text-slate-300"
                            >
                                {badge}
                            </span>
                        ))}
                    </div>
                </section>
                <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-6 shadow-2xl shadow-cyan-950/20">
                    <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-slate-500">
                        <span className="size-2 rounded-full bg-emerald-400" />
                        Live Focus Areas
                    </div>
                    <div className="space-y-4">
                        {focusAreas.map((item) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.title}
                                    className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
                                >
                                    <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                                        <Icon className="size-5" />
                                    </div>
                                    <h2 className="text-base font-semibold text-white">
                                        {item.title}
                                    </h2>
                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                        {item.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
