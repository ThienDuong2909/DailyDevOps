import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { normalizeLocale, withLocale } from "../../lib/i18n/config";

test("locale config helpers keep clean URLs without /vi or /en prefixes", () => {
  assert.equal(normalizeLocale("en"), "en");
  assert.equal(normalizeLocale("vi"), "vi");
  assert.equal(normalizeLocale("fr"), "vi");

  assert.equal(withLocale("/vi", "en"), "/");
  assert.equal(
    withLocale("/en/category/monitoring", "vi"),
    "/category/monitoring",
  );
  assert.equal(withLocale("/category?q=k8s", "en"), "/category?q=k8s");
});

test("set-locale route sets Cache-Control: no-store to prevent stale responses", () => {
  const routeSource = fs.readFileSync(
    path.resolve(process.cwd(), "app/api/set-locale/route.ts"),
    "utf8",
  );

  assert.match(routeSource, /"Cache-Control":\s*"no-store"/);
  assert.match(routeSource, /LOCALE_COOKIE_NAME/);
});

test("blog header locale switcher posts to /api/set-locale with double-click lock and router.refresh()", () => {
  const headerSource = fs.readFileSync(
    path.resolve(process.cwd(), "components/layout/blog-header.tsx"),
    "utf8",
  );

  assert.match(headerSource, /fetch\("\/api\/set-locale"/);
  assert.match(headerSource, /isSwitchingLocale/);
  assert.match(headerSource, /router\.refresh\(\)/);
});

test("patch-opennext-worker separates Edge s-maxage from browser max-age=0 + Vary: Cookie", () => {
  const patcherSource = fs.readFileSync(
    path.resolve(process.cwd(), "scripts/patch-opennext-worker.js"),
    "utf8",
  );

  assert.match(patcherSource, /withVaryCookie/);
  assert.match(
    patcherSource,
    /Cache-Control",\s*"public,\s*max-age=0,\s*must-revalidate"/,
  );
  assert.match(
    patcherSource,
    /Cache-Control",\s*"public,\s*s-maxage=86400,\s*stale-while-revalidate=604800"/,
  );
});
