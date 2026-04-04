import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description:
        'Review the terms that govern reader accounts, editorial content, acceptable use, and service limitations across DevOps Daily.',
    alternates: {
        canonical: '/terms-of-service',
    },
    robots: {
        index: false,
        follow: true,
    },
};

const termsSections = [
    {
        title: 'Acceptable use',
        body: 'You agree to use DevOps Daily in a lawful way, avoid abusive automation, and not interfere with the security, availability, or integrity of the platform.',
    },
    {
        title: 'Accounts and content',
        body: 'You are responsible for credentials tied to your account and for the material you submit. Editorial or community content may be moderated, unpublished, or removed when it violates policy or creates operational risk.',
    },
    {
        title: 'Intellectual property',
        body: 'DevOps Daily content, branding, and site materials remain protected by applicable intellectual property laws unless otherwise stated. Community submissions grant us the right to display and manage that content on the service.',
    },
    {
        title: 'Warranty and liability',
        body: 'The service is provided on an as-is basis. We work to keep information useful and systems available, but we cannot guarantee uninterrupted service or error-free content for every use case.',
    },
];

export default function TermsOfServicePage() {
    return (
        <div className="flex w-full max-w-[1040px] flex-col gap-8">
            <section className="rounded-[32px] border border-cyan-500/15 bg-white px-6 py-10 shadow-sm dark:border-cyan-400/10 dark:bg-surface-dark md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Terms Of Service
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">
                    The operational rules for using DevOps Daily
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-text-sub dark:text-gray-400 md:text-base">
                    These terms describe the basic responsibilities, restrictions, and service
                    boundaries for readers, subscribers, and registered users interacting with the
                    platform.
                </p>
            </section>

            <section className="grid gap-6">
                {termsSections.map((section) => (
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
