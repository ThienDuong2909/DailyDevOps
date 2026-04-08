import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
    title: 'Search Articles',
    description:
        'Search DevOps Daily articles by Kubernetes, CI/CD, monitoring, platform engineering, and production infrastructure topics.',
    alternates: {
        canonical: '/search',
    },
};

export default function SearchPage({
    searchParams,
}: {
    searchParams?: { q?: string; page?: string };
}) {
    const query = searchParams?.q?.trim();
    const page = searchParams?.page?.trim();

    if (!query) {
        redirect('/blog');
    }

    const destination = new URLSearchParams();
    destination.set('q', query);

    if (page && page !== '1') {
        destination.set('page', page);
    }

    redirect(`/blog?${destination.toString()}`);
}
