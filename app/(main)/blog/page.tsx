import { permanentRedirect } from "next/navigation";
import {
  buildBlogRedirectTarget,
  type ListingSearchParams,
} from "@/lib/blog-listing";

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<ListingSearchParams>;
}) {
  const resolved = await searchParams;
  permanentRedirect(buildBlogRedirectTarget(resolved));
}
