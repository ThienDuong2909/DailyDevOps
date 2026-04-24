"use client";

import type { PostWithComments } from "@/types";
import { withLocale } from "@/lib/i18n/config";

/**
 * Generates JSON-LD structured data for a blog post.
 * This helps search engines understand the content better.
 */
export function BlogPostJsonLd({
  post,
  postUrl,
}: Readonly<{
  post: PostWithComments;
  postUrl: string;
}>) {
  const authorName = `${post.author.firstName} ${post.author.lastName}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.title,
    url: postUrl,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.publishedAt || post.createdAt,
    author: {
      "@type": "Person",
      name: authorName,
    },
    publisher: {
      "@type": "Organization",
      name: "DevOps Blog",
      url: "https://dailydevops.blog",
    },
    ...(post.featuredImage && {
      image: {
        "@type": "ImageObject",
        url: post.featuredImage,
      },
    }),
    ...(post.category && {
      articleSection: post.category.name,
    }),
    keywords: post.tags?.map((t) => t.name).join(", "),
    wordCount: post.content ? post.content.split(/\s+/).length : undefined,
    ...(post.readingTime && {
      timeRequired: `PT${post.readingTime}M`,
    }),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    ...(post.comments?.length && {
      commentCount: post.comments.length,
      comment: post.comments.slice(0, 5).map((c) => ({
        "@type": "Comment",
        text: c.content,
        dateCreated: c.createdAt,
        author: {
          "@type": "Person",
          name: c.user
            ? `${c.user.firstName} ${c.user.lastName}`
            : c.authorName || "Anonymous",
        },
      })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/**
 * Generates BreadcrumbList JSON-LD for better search result display.
 */
export function BreadcrumbJsonLd({
  post,
  siteUrl,
  locale,
}: Readonly<{
  post: PostWithComments;
  siteUrl: string;
  locale: "vi" | "en";
}>) {
  const prefixed = (path: string) => `${siteUrl}${withLocale(path, locale)}`;
  const items = [
    { name: "Home", url: prefixed("/") },
    { name: "Blog", url: prefixed("/blog") },
  ];

  if (post.category) {
    items.push({
      name: post.category.name,
      url: prefixed(`/category/${post.category.slug}`),
    });
  }

  items.push({
    name: post.title,
    url: prefixed(`/${post.slug}`),
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
