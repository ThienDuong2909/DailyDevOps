import MiniSearch from "minisearch";

export interface SearchPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string | null;
  category?: { name: string; slug: string; color?: string | null } | null;
  tags?: string[];
  publishedAt?: string | null;
}

export interface SearchCategoryItem {
  name: string;
  slug: string;
}

export interface SearchTagItem {
  name: string;
  slug: string;
}

export interface SearchIndexPayload {
  version: string;
  posts: SearchPostItem[];
  categories: SearchCategoryItem[];
  tags: SearchTagItem[];
}

export interface GroupedSearchResults {
  posts: SearchPostItem[];
  categories: SearchCategoryItem[];
  tags: SearchTagItem[];
  totalMatches: number;
}

/**
 * Normalize Vietnamese text by removing diacritical marks (NFD) and converting 'đ' to 'd'
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .trim();
}

/**
 * Collapses characters repeated 2+ times consecutively to a single character.
 * E.g., "dockerr" -> "docker", "kkuubbee" -> "kube"
 */
export function collapseDuplicateCharacters(str: string): string {
  if (!str) return "";
  return str.replace(/(.)\1+/g, "$1");
}

/**
 * Common DevOps technical aliases and acronyms mapping
 */
export const TECH_ALIASES: Record<string, string[]> = {
  k8s: ["kubernetes", "k8s"],
  kubernetes: ["k8s", "kubernetes"],
  cicd: ["ci/cd", "continuous integration", "pipeline", "cicd"],
  "ci/cd": ["cicd", "continuous integration", "pipeline"],
  tf: ["terraform", "tf"],
  terraform: ["tf", "terraform"],
  prom: ["prometheus", "prom"],
  prometheus: ["prom", "prometheus"],
  graf: ["grafana", "graf"],
  grafana: ["graf", "grafana"],
  gh: ["github", "gh"],
  github: ["gh", "github"],
  iac: ["infrastructure as code", "iac"],
  "infrastructure as code": ["iac", "terraform", "ansible"],
  ans: ["ansible", "ans"],
  ansible: ["ans", "ansible"],
  dc: ["docker-compose", "docker compose"],
};

/**
 * Highlight matching terms in a text string
 */
export function highlightText(
  text: string,
  query: string,
): Array<{ text: string; match: boolean }> {
  if (!text || !query.trim()) {
    return [{ text: text || "", match: false }];
  }

  const normalizedQuery = normalizeVietnamese(query);
  const normalizedText = normalizeVietnamese(text);
  const terms = normalizedQuery
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .sort((a, b) => b.length - a.length);

  if (terms.length === 0) {
    return [{ text, match: false }];
  }

  const ranges: Array<{ start: number; end: number }> = [];

  for (const term of terms) {
    let index = normalizedText.indexOf(term);
    while (index !== -1) {
      ranges.push({ start: index, end: index + term.length });
      index = normalizedText.indexOf(term, index + 1);
    }
  }

  if (ranges.length === 0) {
    return [{ text, match: false }];
  }

  ranges.sort((a, b) => a.start - b.start);
  const mergedRanges: Array<{ start: number; end: number }> = [];
  let currentRange = ranges[0];

  for (let i = 1; i < ranges.length; i++) {
    const next = ranges[i];
    if (next.start <= currentRange.end) {
      currentRange.end = Math.max(currentRange.end, next.end);
    } else {
      mergedRanges.push(currentRange);
      currentRange = next;
    }
  }
  mergedRanges.push(currentRange);

  const parts: Array<{ text: string; match: boolean }> = [];
  let lastIndex = 0;

  for (const range of mergedRanges) {
    if (range.start > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, range.start),
        match: false,
      });
    }
    parts.push({
      text: text.slice(range.start, range.end),
      match: true,
    });
    lastIndex = range.end;
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      match: false,
    });
  }

  return parts;
}

interface IndexedDoc {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string | null;
  categoryName: string;
  tags: string;
  publishedAt?: string | null;
  normalizedTitle: string;
  normalizedExcerpt: string;
  category?: { name: string; slug: string; color?: string | null } | null;
  rawTags?: string[];
}

export class SmartSearchEngine {
  private miniSearch: MiniSearch<IndexedDoc> | null = null;
  private posts: SearchPostItem[] = [];
  private categories: SearchCategoryItem[] = [];
  private tags: SearchTagItem[] = [];
  private isInitialized = false;
  private currentLocale = "vi";

  constructor() {
    this.initMiniSearch();
  }

  private initMiniSearch() {
    this.miniSearch = new MiniSearch<IndexedDoc>({
      fields: [
        "title",
        "normalizedTitle",
        "categoryName",
        "tags",
        "excerpt",
        "normalizedExcerpt",
      ],
      storeFields: [
        "id",
        "title",
        "slug",
        "excerpt",
        "featuredImage",
        "category",
        "rawTags",
        "publishedAt",
      ],
      processTerm: (term) => normalizeVietnamese(term),
      searchOptions: {
        boost: {
          title: 4,
          normalizedTitle: 4,
          categoryName: 3,
          tags: 2.5,
          excerpt: 1,
          normalizedExcerpt: 1,
        },
        prefix: true,
        fuzzy: (term) => {
          const len = term.length;
          if (len <= 2) return false;
          if (len <= 5) return 1;
          if (len <= 8) return 2;
          return 3;
        },
      },
    });
  }

  public setIndex(payload: SearchIndexPayload, locale = "vi") {
    if (!this.miniSearch) {
      this.initMiniSearch();
    } else {
      this.miniSearch.removeAll();
    }

    this.currentLocale = locale;
    this.posts = payload.posts || [];
    this.categories = payload.categories || [];
    this.tags = payload.tags || [];

    const docs: IndexedDoc[] = (payload.posts || []).map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      featuredImage: post.featuredImage,
      categoryName: post.category?.name || "",
      tags: (post.tags || []).join(" "),
      publishedAt: post.publishedAt,
      normalizedTitle: normalizeVietnamese(post.title),
      normalizedExcerpt: normalizeVietnamese(post.excerpt),
      category: post.category,
      rawTags: post.tags,
    }));

    this.miniSearch!.addAll(docs);
    this.isInitialized = true;
  }

  public search(
    query: string,
    options: { limit?: number } = {},
  ): GroupedSearchResults {
    const rawQuery = (query || "").trim();
    if (!rawQuery || !this.isInitialized || !this.miniSearch) {
      return { posts: [], categories: [], tags: [], totalMatches: 0 };
    }

    const limit = options.limit || 8;
    const normalized = normalizeVietnamese(rawQuery);
    const collapsed = collapseDuplicateCharacters(normalized);
    const aliasTerms =
      TECH_ALIASES[normalized] || TECH_ALIASES[collapsed] || [];

    // Search categories
    const matchedCategories = this.categories
      .filter((cat) => {
        const normName = normalizeVietnamese(cat.name);
        const normSlug = normalizeVietnamese(cat.slug);
        return (
          normName.includes(normalized) ||
          normName.includes(collapsed) ||
          normSlug.includes(normalized) ||
          aliasTerms.some((a) => normName.includes(a) || normSlug.includes(a))
        );
      })
      .slice(0, 3);

    // Search tags
    const matchedTags = this.tags
      .filter((tag) => {
        const normName = normalizeVietnamese(tag.name);
        const normSlug = normalizeVietnamese(tag.slug);
        return (
          normName.includes(normalized) ||
          normName.includes(collapsed) ||
          normSlug.includes(normalized) ||
          aliasTerms.some((a) => normName.includes(a) || normSlug.includes(a))
        );
      })
      .slice(0, 5);

    // Search posts with query expansion
    const candidateQueries = [rawQuery, normalized, collapsed, ...aliasTerms];
    const seenPostIds = new Set<string>();
    const matchedPosts: SearchPostItem[] = [];

    for (const q of candidateQueries) {
      if (!q) continue;
      const results = this.miniSearch.search(q);
      for (const res of results) {
        if (!seenPostIds.has(res.id)) {
          seenPostIds.add(res.id);
          matchedPosts.push({
            id: res.id,
            title: res.title,
            slug: res.slug,
            excerpt: res.excerpt,
            featuredImage: res.featuredImage,
            category: res.category,
            tags: res.rawTags,
            publishedAt: res.publishedAt,
          });
          if (matchedPosts.length >= limit) break;
        }
      }
      if (matchedPosts.length >= limit) break;
    }

    const totalMatches =
      matchedPosts.length + matchedCategories.length + matchedTags.length;

    return {
      posts: matchedPosts,
      categories: matchedCategories,
      tags: matchedTags,
      totalMatches,
    };
  }

  public getAllPosts(): SearchPostItem[] {
    return this.posts;
  }

  public getAllCategories(): SearchCategoryItem[] {
    return this.categories;
  }

  public getAllTags(): SearchTagItem[] {
    return this.tags;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getLocale(): string {
    return this.currentLocale;
  }
}

// Global engine instance cache
let engineInstance: SmartSearchEngine | null = null;
let indexCache: Record<string, SearchIndexPayload> = {};

export function getSearchEngine(): SmartSearchEngine {
  if (!engineInstance) {
    engineInstance = new SmartSearchEngine();
  }
  return engineInstance;
}

/**
 * Fetch and initialize the search index for a given locale (Client-side)
 */
export async function loadSearchIndex(
  locale = "vi",
): Promise<SmartSearchEngine> {
  const engine = getSearchEngine();

  if (indexCache[locale] && engine.isReady() && engine.getLocale() === locale) {
    return engine;
  }

  try {
    const res = await fetch(
      `/api/v1/posts/search-index?locale=${encodeURIComponent(locale)}`,
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch search index: ${res.status}`);
    }
    const json = await res.json();
    if (json.success && json.data) {
      indexCache[locale] = json.data;
      engine.setIndex(json.data, locale);
    }
  } catch (err) {
    console.warn("[SmartSearch] Error loading search index:", err);
  }

  return engine;
}
