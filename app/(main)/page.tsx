import type { Metadata } from "next";
import { BlogHomeContent } from "@/components/blog/home/blog-home-content";
import { fetchCategories, fetchPublishedPosts } from "@/lib/api/server";
import { getRequestLocale } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/constants/site";
import type { Category, Post } from "@/types";

export const metadata: Metadata = {
  title: "Daily DevOps — Automate Everything, Deploy Anywhere",
  description:
    "DevOps Blog — Nguồn tài liệu thực chiến dành cho kỹ sư DevOps, SRE và Platform Engineer. Chuyên sâu về Kubernetes, Docker, CI/CD, ArgoCD và Monitoring.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    title: "Daily DevOps — Automate Everything, Deploy Anywhere",
    description:
      "DevOps Blog — Nguồn tài liệu thực chiến dành cho kỹ sư DevOps, SRE và Platform Engineer. Chuyên sâu về Kubernetes, Docker, CI/CD, ArgoCD và Monitoring.",
    url: SITE_URL,
    siteName: "DevOps Blog",
  },
};

export default async function MainHomePage({
  initialPosts,
  initialCategories,
}: {
  initialPosts?: Post[];
  initialCategories?: Category[];
} = {}) {
  const locale = await getRequestLocale();
  const posts = initialPosts || (await fetchPublishedPosts(locale, 12));
  const categories = initialCategories || (await fetchCategories());

  return (
    <BlogHomeContent initialPosts={posts} initialCategories={categories} />
  );
}
