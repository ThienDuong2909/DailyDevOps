import type { Metadata } from 'next';
import Link from 'next/link';
import { NewsletterSignupForm } from '@/components/blog/newsletter-signup-form';

export const metadata: Metadata = {
    title: 'DevOps Daily Newsletter',
    description:
        'Subscribe to the DevOps Daily newsletter for weekly notes on Kubernetes, CI/CD, observability, reliability, and real-world infrastructure workflows.',
    alternates: {
        canonical: '/newsletter',
    },
};

export default function NewsletterPage() {
    return (
        <div className="flex w-full max-w-[1280px] flex-col gap-8">
            <section className="relative overflow-hidden rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        background:
                            'radial-gradient(circle at top left, rgba(34,211,238,0.35), transparent 35%), radial-gradient(circle at 85% 10%, rgba(59,130,246,0.28), transparent 30%)',
                    }}
                />
                <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
                    <div className="space-y-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                            Newsletter
                        </p>
                        <h1 className="max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                            Weekly notes for engineers shipping real infrastructure
                        </h1>
                        <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                            DevOps Daily curates practical lessons on Kubernetes, CI/CD, observability,
                            platform engineering, and production operations. Every issue is built to be
                            skim-friendly and useful on the same day you read it.
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-200">
                            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                                Weekly delivery
                            </span>
                            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                                Practical links
                            </span>
                            <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2">
                                Unsubscribe anytime
                            </span>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur">
                        <h2 className="text-xl font-bold">Join the list</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Subscribe for new articles, curated tooling, and operator-grade workflows.
                        </p>
                        <NewsletterSignupForm
                            buttonClassName="bg-cyan-500 hover:bg-cyan-400"
                            buttonLabel="Join newsletter"
                            className="mt-5"
                            helperText="We only send useful updates and product-worthy writeups."
                            inputClassName="bg-white"
                            stacked
                        />
                    </div>
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-3">
                <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        What you get
                    </p>
                    <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
                        Concise operator updates
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                        Shipping notes on pipelines, reliability, incident learnings, deployment
                        patterns, and tooling decisions worth copying.
                    </p>
                </article>
                <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Reading modes
                    </p>
                    <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
                        Email and RSS together
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                        Prefer feed readers? Use the site RSS feed for every published post and keep
                        the newsletter for weekly highlights.
                    </p>
                    <Link
                        className="mt-4 inline-flex text-sm font-semibold text-primary hover:text-blue-600"
                        href="/rss.xml"
                    >
                        Open RSS feed
                    </Link>
                </article>
                <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Subscriber control
                    </p>
                    <h2 className="mt-3 text-xl font-bold text-text-main dark:text-white">
                        Leave anytime
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                        Every subscriber gets an unsubscribe token in the backend model, so the flow is
                        already ready for a one-click opt-out experience.
                    </p>
                </article>
            </section>
        </div>
    );
}
