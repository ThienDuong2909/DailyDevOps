import type { Metadata } from "next";
import { Suspense } from "react";
import { BlogListingContent } from "@/components/blog/blog-listing-content";
import { SITE_URL } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Tất cả bài viết DevOps, CI/CD, Kubernetes | Daily DevOps",
  description:
    "Tổng hợp tất cả các bài viết thực chiến về DevOps, Kubernetes, CI/CD, Docker, Cloud và Monitoring trên Daily DevOps.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    title: "Tất cả bài viết DevOps, CI/CD, Kubernetes | Daily DevOps",
    description:
      "Tổng hợp tất cả các bài viết thực chiến về DevOps, Kubernetes, CI/CD, Docker, Cloud và Monitoring trên Daily DevOps.",
    url: `${SITE_URL}/blog`,
    siteName: "DevOps Blog",
  },
  twitter: {
    card: "summary",
    title: "Tất cả bài viết DevOps, CI/CD, Kubernetes | Daily DevOps",
    description:
      "Tổng hợp tất cả các bài viết thực chiến về DevOps, Kubernetes, CI/CD, Docker, Cloud và Monitoring trên Daily DevOps.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

function BlogListingFallback() {
  return (
    <div className="flex w-full max-w-[1280px] flex-col gap-8">
      <header className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
          <div className="h-5 w-96 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-11 max-w-md flex-1 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
          <div className="h-10 w-52 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
        </div>
      </header>
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-9 animate-pulse rounded-full bg-[var(--surface-muted)]"
            style={{ width: 64 + (i % 3) * 22 }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl bg-[var(--surface-elevated)] shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
          >
            <div className="aspect-[16/9] w-full animate-pulse bg-[var(--surface-muted)]" />
            <div className="space-y-3 px-5 pb-5 pt-4">
              <div className="h-5 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="flex items-center gap-2 pt-1">
                <div className="size-7 animate-pulse rounded-full bg-[var(--surface-muted)]" />
                <div className="h-4 w-32 animate-pulse rounded bg-[var(--surface-muted)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense fallback={<BlogListingFallback />}>
      <BlogListingContent />
    </Suspense>
  );
}
