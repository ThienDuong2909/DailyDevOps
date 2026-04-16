import { redirect } from 'next/navigation';
import { DEFAULT_LOCALE, normalizeLocale, withLocale } from '@/lib/i18n/config';

export async function resolveSearchRedirect(
    searchParams?: Promise<{ q?: string; page?: string }>,
    locale: string = DEFAULT_LOCALE
) {
    const resolvedLocale = normalizeLocale(locale || DEFAULT_LOCALE);
    const resolvedParams = await searchParams;
    const query = resolvedParams?.q?.trim();
    const page = resolvedParams?.page?.trim();

    if (!query) {
        redirect(withLocale('/blog', resolvedLocale));
    }

    const destination = new URLSearchParams();
    destination.set('q', query);

    if (page && page !== '1') {
        destination.set('page', page);
    }

    redirect(`${withLocale('/blog', resolvedLocale)}?${destination.toString()}`);
}
