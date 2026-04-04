const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://blog.thienduong.info';

const apiBaseUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001';

type RssPost = {
    id: string;
    slug: string;
    title: string;
    excerpt?: string;
    publishedAt?: string;
    updatedAt: string;
    author?: {
        firstName?: string;
        lastName?: string;
    };
    category?: {
        name?: string;
    };
};

function escapeXml(value: string) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

async function fetchPublishedPosts(): Promise<RssPost[]> {
    try {
        const response = await fetch(
            `${apiBaseUrl}/api/v1/posts/published?limit=50&sortBy=publishedAt&sortOrder=desc`,
            {
                next: { revalidate: 1800 },
            }
        );

        if (!response.ok) {
            return [];
        }

        const json = await response.json();
        return json.data?.data || json.data || [];
    } catch {
        return [];
    }
}

export async function GET() {
    const posts = await fetchPublishedPosts();

    const items = posts
        .map((post) => {
            const link = `${siteUrl}/blog/${post.slug}`;
            const authorName = [post.author?.firstName, post.author?.lastName]
                .filter(Boolean)
                .join(' ')
                .trim();
            const description = post.excerpt || 'Read the latest DevOps Daily article.';
            const category = post.category?.name ? `<category>${escapeXml(post.category.name)}</category>` : '';

            return [
                '<item>',
                `<title>${escapeXml(post.title)}</title>`,
                `<link>${escapeXml(link)}</link>`,
                `<guid>${escapeXml(link)}</guid>`,
                `<description>${escapeXml(description)}</description>`,
                `<pubDate>${new Date(post.publishedAt || post.updatedAt).toUTCString()}</pubDate>`,
                authorName ? `<author>${escapeXml(authorName)}</author>` : '',
                category,
                '</item>',
            ]
                .filter(Boolean)
                .join('');
        })
        .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>DevOps Daily</title>
<link>${escapeXml(siteUrl)}</link>
<description>Latest DevOps Daily articles on Kubernetes, CI/CD, automation, and platform engineering.</description>
<language>en-us</language>
${items}
</channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600',
        },
    });
}
