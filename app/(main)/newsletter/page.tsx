import type { Metadata } from 'next';
import { NewsletterPageContent } from './newsletter-page-content';

export const metadata: Metadata = {
    title: 'DevOps Daily Newsletter',
    description:
        'Subscribe to the DevOps Daily newsletter for weekly notes on Kubernetes, CI/CD, observability, reliability, and real-world infrastructure workflows.',
    alternates: {
        canonical: '/newsletter',
    },
};

export default function NewsletterPage() {
    return <NewsletterPageContent locale="vi" />;
}
