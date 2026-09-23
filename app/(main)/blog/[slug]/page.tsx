import { permanentRedirect } from "next/navigation";

const KNOWN_CATEGORIES = new Set([
  "devops",
  "kubernetes",
  "cicd",
  "docker",
  "monitoring",
  "automation",
  "security",
]);

export default async function LegacyBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cleanSlug = (slug || "").toLowerCase();

  if (KNOWN_CATEGORIES.has(cleanSlug)) {
    permanentRedirect(`/category/${cleanSlug}`);
  }

  permanentRedirect(`/${slug}`);
}
