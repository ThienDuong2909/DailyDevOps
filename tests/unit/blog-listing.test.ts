import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildBlogRedirectTarget,
  buildCategoryDetailMetadata,
  buildCategoryIndexMetadata,
  normalizeListingSearchParams,
} from "../../lib/blog-listing";

describe("blog-listing helpers", () => {
  it("redirects /blog without category to /category preserving non-default query params", () => {
    assert.equal(buildBlogRedirectTarget(), "/category");
    assert.equal(
      buildBlogRedirectTarget({ category: "all", sort: "latest", page: "1" }),
      "/category",
    );
    assert.equal(
      buildBlogRedirectTarget({ q: "k8s", sort: "popular", page: "2" }),
      "/category?q=k8s&sort=popular&page=2",
    );
  });

  it("redirects /blog?category=slug to /category/slug while dropping redundant category param", () => {
    assert.equal(
      buildBlogRedirectTarget({
        category: "monitoring",
        sort: "oldest",
        page: "3",
      }),
      "/category/monitoring?sort=oldest&page=3",
    );
  });

  it("normalizes page, sort, and search query safely", () => {
    assert.deepEqual(
      normalizeListingSearchParams({
        page: "-5",
        sort: "invalid",
        q: "  docker  ",
      }),
      {
        page: 1,
        sort: "latest",
        query: "docker",
        hasSearch: true,
      },
    );
    assert.deepEqual(
      normalizeListingSearchParams({ page: "2", sort: "popular" }),
      {
        page: 2,
        sort: "popular",
        query: "",
        hasSearch: false,
      },
    );
  });

  it("sets canonical /category on index metadata and /category/{slug} on category metadata", () => {
    const indexMeta = buildCategoryIndexMetadata("vi");
    assert.match(String(indexMeta.alternates?.canonical), /\/category$/);
    assert.ok(!String(indexMeta.title).includes("| DevOps Blog"));

    const catMeta = buildCategoryDetailMetadata({
      category: { name: "Monitoring", slug: "monitoring", description: null },
      locale: "en",
    });
    assert.match(
      String(catMeta.alternates?.canonical),
      /\/category\/monitoring$/,
    );
    assert.equal(catMeta.title, "Monitoring Articles");
    assert.equal(
      catMeta.robots && typeof catMeta.robots === "object"
        ? catMeta.robots.index
        : undefined,
      true,
    );
  });

  it("marks missing category metadata as noindex", () => {
    const missingMeta = buildCategoryDetailMetadata({
      category: null,
      locale: "vi",
    });
    assert.equal(
      missingMeta.robots && typeof missingMeta.robots === "object"
        ? missingMeta.robots.index
        : undefined,
      false,
    );
  });
});
