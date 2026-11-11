import test from "node:test";
import assert from "node:assert/strict";
import {
  optimizeImagesInHtml,
  transformPostContent,
} from "../../lib/content-transform";

test("optimizeImagesInHtml injects loading='lazy' and decoding='async' into img tags", () => {
  const rawHtml = '<p>Hello</p><img src="/test.png" alt="Test"><p>World</p>';
  const result = optimizeImagesInHtml(rawHtml);

  assert.match(result, /loading="lazy"/);
  assert.match(result, /decoding="async"/);
  assert.match(result, /src="\/test\.png"/);
});

test("optimizeImagesInHtml does not duplicate existing loading or decoding attributes", () => {
  const rawHtml =
    '<img src="/hero.png" loading="eager" decoding="sync" alt="Hero">';
  const result = optimizeImagesInHtml(rawHtml);

  assert.equal(
    result,
    '<img src="/hero.png" loading="eager" decoding="sync" alt="Hero">',
  );
});

test("transformPostContent strips H1 and injects lazy loading into content images", () => {
  const rawContent = '<h1>Main Title</h1><p>Text</p><img src="/diagram.png">';
  const result = transformPostContent(rawContent);

  assert.equal(result.includes("<h1>Main Title</h1>"), false);
  assert.match(
    result,
    /<img\s+src="\/diagram\.png"\s+loading="lazy"\s+decoding="async">/,
  );
});
