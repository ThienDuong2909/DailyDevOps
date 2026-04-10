import { GET as getIndex } from '../sitemap_index.xml/route';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export async function GET() {
    return getIndex();
}
