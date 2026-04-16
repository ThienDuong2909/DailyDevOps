import type { Metadata } from 'next';
import { TermsOfServicePageContent } from './terms-of-service-page-content';

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

export default function TermsOfServicePage() {
    return <TermsOfServicePageContent locale="vi" />;
}
