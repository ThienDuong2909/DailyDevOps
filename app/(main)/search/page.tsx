import type { Metadata } from 'next';
import { SearchPageClient } from './search-page-client';

export const metadata: Metadata = {
    title: 'Search Articles',
    description:
        'Search DevOps Daily articles by Kubernetes, CI/CD, monitoring, platform engineering, and production infrastructure topics.',
    alternates: {
        canonical: '/search',
    },
};

export default function SearchPage() {
    return <SearchPageClient />;
}
