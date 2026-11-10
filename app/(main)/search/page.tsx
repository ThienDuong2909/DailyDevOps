import type { Metadata } from "next";
import { SearchPageClient } from "./search-page-client";
import { SITE_URL } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Tìm kiếm bài viết | Daily DevOps",
  description:
    "Tìm kiếm các bài viết, cẩm nang và hướng dẫn thực chiến về DevOps, Kubernetes, CI/CD, Docker, Cloud, Monitoring và Infrastructure as Code trên Daily DevOps.",
  alternates: {
    canonical: `${SITE_URL}/search`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return (
    <div className="w-full max-w-[1280px]">
      <SearchPageClient />
    </div>
  );
}
