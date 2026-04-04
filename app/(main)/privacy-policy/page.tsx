import type { Metadata } from 'next';
import { DataRightsPanel } from '@/components/privacy/data-rights-panel';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description:
        'Read how DevOps Daily handles account data, newsletter subscriptions, comments, support requests, and privacy controls for registered users and readers.',
    alternates: {
        canonical: '/privacy-policy',
    },
    robots: {
        index: false,
        follow: true,
    },
};

const privacySections = [
    {
        title: 'Information we collect',
        body: 'We collect the information you submit directly, including account details, newsletter subscriptions, comments, and contact requests. We also store essential technical data needed for security, authentication, and performance monitoring.',
    },
    {
        title: 'How we use it',
        body: 'We use your information to operate the site, manage accounts, send requested emails, secure the platform, moderate community features, and improve editorial and product quality.',
    },
    {
        title: 'Sharing and processors',
        body: 'We only share information with service providers necessary to run DevOps Daily, such as hosting, email delivery, database infrastructure, and observability tooling. We do not sell personal information.',
    },
    {
        title: 'Retention and deletion',
        body: 'We retain account, editorial, and subscriber records for as long as needed to provide the service, meet legal obligations, and preserve security logs. You can request data review or deletion through the contact page.',
    },
];

export default function PrivacyPolicyPage() {
    return (
        <div className="flex w-full max-w-[1040px] flex-col gap-8">
            <section className="rounded-[32px] bg-slate-950 px-6 py-10 text-white shadow-xl md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                    Privacy Policy
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                    How DevOps Daily handles personal data
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                    This policy explains what information we collect, why we process it, and the
                    controls available to readers, subscribers, and account holders using DevOps
                    Daily.
                </p>
            </section>

            <section className="grid gap-6">
                {privacySections.map((section) => (
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

            <DataRightsPanel />
        </div>
    );
}
