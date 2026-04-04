import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'About DevOps Daily',
    description:
        'Learn what DevOps Daily covers, how the editorial team approaches practical infrastructure content, and where the publication focuses across DevOps and platform engineering.',
    alternates: {
        canonical: '/about',
    },
};

const editorialValues = [
    {
        title: 'Operational clarity',
        description:
            'We prefer concrete examples, real tradeoffs, and writeups that help teams ship with less ambiguity.',
    },
    {
        title: 'Hands-on systems thinking',
        description:
            'Every topic is grounded in the day-to-day work of pipelines, incidents, Kubernetes clusters, and platform engineering.',
    },
    {
        title: 'Useful over performative',
        description:
            'The goal is not noise or trend-chasing. The goal is practical guidance that saves engineering time.',
    },
];

const coverageAreas = [
    'CI/CD pipelines and release automation',
    'Kubernetes operations and platform tooling',
    'Observability, alerting, and incident response',
    'Cloud infrastructure, IaC, and reliability patterns',
];

export default function AboutPage() {
    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="relative overflow-hidden rounded-[32px] border border-cyan-500/15 bg-white px-6 py-10 shadow-sm dark:border-cyan-400/10 dark:bg-surface-dark md:px-10 md:py-14">
                <div
                    className="absolute inset-0 opacity-50"
                    style={{
                        background:
                            'radial-gradient(circle at 10% 10%, rgba(34,211,238,0.12), transparent 28%), radial-gradient(circle at 85% 0%, rgba(59,130,246,0.1), transparent 28%)',
                    }}
                />
                <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                            About DevOps Daily
                        </p>
                        <h1 className="max-w-3xl text-3xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">
                            A publication for teams running production systems with intent
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400 md:text-base">
                            DevOps Daily exists to turn infrastructure experience into readable,
                            practical guidance. We cover the systems work behind reliable delivery:
                            build pipelines, cluster operations, observability, automation, and the
                            engineering habits that keep teams shipping.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/blog"
                                className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
                            >
                                Read articles
                            </Link>
                            <Link
                                href="/newsletter"
                                className="inline-flex h-11 items-center rounded-xl border border-gray-200 px-5 text-sm font-semibold text-text-main transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:text-white"
                            >
                                Join newsletter
                            </Link>
                        </div>
                    </div>

                    <div className="grid gap-4 rounded-[28px] bg-slate-950 p-6 text-white shadow-lg">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                                Focus areas
                            </p>
                            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                                {coverageAreas.map((item) => (
                                    <li key={item} className="flex items-start gap-3">
                                        <span className="mt-2 size-2 rounded-full bg-cyan-400" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                {editorialValues.map((value) => (
                    <article
                        key={value.title}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            Editorial value
                        </p>
                        <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
                            {value.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                            {value.description}
                        </p>
                    </article>
                ))}
            </section>

            <section className="rounded-[32px] border border-gray-200 bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-6 py-8 shadow-sm dark:border-gray-800 dark:bg-surface-dark md:px-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                            Work with us
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-text-main dark:text-white">
                            Have an idea, pitch, or partnership conversation?
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-text-sub dark:text-gray-400">
                            We can use the contact page as the front door for guest posts, collaboration,
                            and feedback from the DevOps community.
                        </p>
                    </div>
                    <Link
                        href="/contact"
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                    >
                        Contact DevOps Daily
                    </Link>
                </div>
            </section>
        </div>
    );
}
