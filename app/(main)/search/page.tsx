import type { Metadata } from 'next';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';
import { resolveSearchRedirect } from './search-redirect';

export const metadata: Metadata = {
    title: 'Search Articles',
    description:
        'Search DevOps Daily articles by Kubernetes, CI/CD, monitoring, platform engineering, and production infrastructure topics.',
    alternates: {
        canonical: '/search',
    },
};

export default async function SearchPage({
    searchParams,
}: {
    searchParams?: Promise<{ q?: string; page?: string }>;
}) {
    await resolveSearchRedirect(searchParams, DEFAULT_LOCALE);
}
