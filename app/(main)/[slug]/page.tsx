import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE } from '@/lib/i18n/config';

export default async function LegacyPostDetailPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    redirect(`/${DEFAULT_LOCALE}/${slug}`);
}
