import type { Metadata } from 'next';
import { CookiePolicyPageContent } from './cookie-policy-page-content';

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

export default function CookiePolicyPage() {
    return <CookiePolicyPageContent locale="vi" />;
}
