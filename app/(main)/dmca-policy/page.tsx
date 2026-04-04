import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'DMCA Policy',
    description:
        'Review the DevOps Daily copyright complaint, takedown, counter notice, and repeat infringement process for editorial and community content.',
    alternates: {
        canonical: '/dmca-policy',
    },
    robots: {
        index: false,
        follow: true,
    },
};

const dmcaSections = [
    {
        title: 'Reporting copyrighted material',
        body: 'If you believe content on DevOps Daily infringes your copyright, send a notice through the contact page with your legal name, contact details, the original work, the infringing URL, and a good-faith statement confirming your claim.',
    },
    {
        title: 'What happens after a notice',
        body: 'We review properly submitted notices, investigate the affected material, and may temporarily remove or limit access while we verify the claim. We may contact both the reporting party and the content owner for clarification.',
    },
    {
        title: 'Counter notices',
        body: 'If your content was removed in error, you may submit a counter notice with enough information for us to evaluate ownership, authorization, or fair use. We will restore content when appropriate and legally permitted.',
    },
    {
        title: 'Repeat infringement and editorial action',
        body: 'DevOps Daily may suspend accounts, reject submissions, or remove published content from contributors who repeatedly violate intellectual property rules or ignore editorial takedown requests.',
    },
];

export default function DmcaPolicyPage() {
    return (
        <div className="flex w-full max-w-[1040px] flex-col gap-8">
            <section className="rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    DMCA Policy
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                    Copyright complaints and takedown process
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                    This policy explains how DevOps Daily handles copyright complaints, removal
                    requests, counter notices, and repeat infringement across editorial and
                    community content.
                </p>
            </section>

            <section className="grid gap-6">
                {dmcaSections.map((section) => (
                    <article
                        key={section.title}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <h2 className="text-xl font-bold text-text-main dark:text-white">
                            {section.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                            {section.body}
                        </p>
                    </article>
                ))}
            </section>
        </div>
    );
}
