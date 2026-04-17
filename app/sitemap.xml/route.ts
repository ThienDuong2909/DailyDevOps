import { GET as getIndex } from '../sitemap_index.xml/route';

export const revalidate = 3600;

export async function GET() {
    return getIndex();
}
