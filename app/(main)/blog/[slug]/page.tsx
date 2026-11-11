import { permanentRedirect } from "next/navigation";
import { fetchCategoryBySlug } from "@/lib/api/server";

export default async function LegacyBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cleanSlug = (slug || "").toLowerCase();
  const category = await fetchCategoryBySlug(cleanSlug);

  if (category) {
    permanentRedirect(`/category/${category.slug}`);
  }

  permanentRedirect(`/${slug}`);
}
