import type { Metadata } from "next";
import { BlogHomeContent } from "@/components/blog/home/blog-home-content";
import { SITE_URL } from "@/lib/constants/site";

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

export default function MainHomePage() {
  return <BlogHomeContent />;
}
