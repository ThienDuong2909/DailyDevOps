import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Cookie Policy',
    description:
        'Understand how DevOps Daily uses essential cookies, local storage, and consent preferences across the public site experience.',
    alternates: {
        canonical: '/cookie-policy',
    },
    robots: {
        index: false,
        follow: true,
    },
};

const cookieCategories = [
    {
        title: 'Essential cookies',
        body: 'These support login sessions, security protections, and core interface preferences such as theme state. They are required for the site to function properly.',
    },
    {
        title: 'Measurement preferences',
        body: 'Where enabled, these help us understand traffic patterns, content performance, and product issues so we can improve the platform without over-collecting personal data.',
    },
    {
        title: 'Your choices',
        body: 'You can accept broader measurement cookies or continue with essential-only storage through the site banner. Browser-level controls can also clear or block stored data.',
    },
];

export default function CookiePolicyPage() {
    return (
        <div className="flex w-full max-w-[1040px] flex-col gap-8">
            <section className="rounded-[32px] bg-gradient-to-r from-cyan-50 via-white to-blue-50 px-6 py-10 shadow-sm dark:bg-surface-dark md:px-10 md:py-14">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    Cookie Policy
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-main dark:text-white md:text-5xl">
                    The storage and preference controls used on this site
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-text-sub dark:text-gray-400 md:text-base">
                    This page explains what cookies or local storage entries DevOps Daily uses, why
                    they exist, and how consent is handled across the public experience.
                </p>
            </section>

            <section className="grid gap-6">
                {cookieCategories.map((category) => (
                    <article
                        key={category.title}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-surface-dark"
                    >
                        <h2 className="text-xl font-bold text-text-main dark:text-white">
                            {category.title}
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-text-sub dark:text-gray-400">
                            {category.body}
                        </p>
                    </article>
                ))}
            </section>
        </div>
    );
}
