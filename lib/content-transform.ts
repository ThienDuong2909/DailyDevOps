/**
 * Content transformation utilities for blog post HTML.
 * Handles code block styling and heading normalization.
 */

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface HeadingNormalizationResult {
  html: string;
  toc: TocItem[];
}

const NON_HEADING_SLUG_CHARACTERS_REGEX = /[^a-z0-9\u00C0-\u024f\s-]/gi;
const HEADING_WHITESPACE_REGEX = /\s+/g;
const HEADING_REPEATED_HYPHENS_REGEX = /-+/g;
const TITLE_HEADING_REGEX = /<h1[^>]*>[\s\S]*?<\/h1>/gi;
const CODE_BLOCK_REGEX =
  /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi;

export function slugifyHeading(value: string) {
  let slug = value
    .toLowerCase()
    .trim()
    .replaceAll(NON_HEADING_SLUG_CHARACTERS_REGEX, "")
    .replaceAll(HEADING_WHITESPACE_REGEX, "-")
    .replaceAll(HEADING_REPEATED_HYPHENS_REGEX, "-");

  while (slug.startsWith("-")) {
    slug = slug.slice(1);
  }

  while (slug.endsWith("-")) {
    slug = slug.slice(0, -1);
  }

  return slug;
}

export function normalizeContentHeadings(
  html: string,
): HeadingNormalizationResult {
  if (globalThis.window === undefined || !html.trim()) {
    return { html, toc: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const toc: TocItem[] = [];

  Array.from(doc.querySelectorAll("h1, h2, h3")).forEach((node, index) => {
    const text = (node.textContent || "").trim();
    if (!text) return;

    const id = `${slugifyHeading(text) || "heading"}-${index}`;
    const level = node.tagName === "H3" ? 3 : 2;
    node.setAttribute("id", id);

    if (node.tagName !== "H1") {
      const anchor = doc.createElement("a");
      anchor.setAttribute("href", `#${id}`);
      anchor.setAttribute("class", "heading-anchor-link");
      anchor.setAttribute("aria-label", `Jump to ${text}`);
      anchor.textContent = "#";
      node.appendChild(anchor);

      toc.push({ id, text, level });
    }
  });

  return {
    html: doc.body.innerHTML,
    toc,
  };
}

/**
 * Transforms raw post content HTML:
 * - Strips the first H1 (already in the page title)
 * - Wraps code blocks in macOS-style mockup containers
 */
export function transformPostContent(primaryContent: string): string {
  if (!primaryContent) return "";
  const withoutTitleHeading = primaryContent.replaceAll(
    TITLE_HEADING_REGEX,
    "",
  );
  return withoutTitleHeading.replaceAll(
    CODE_BLOCK_REGEX,
    (_m, preAttrs, codeAttrs, content) => {
      const extractAttributeValue = (source: string, attributeName: string) => {
        const normalizedSource = String(source || "");
        const marker = `${attributeName}=`;
        const attributeIndex = normalizedSource.toLowerCase().indexOf(marker);

        if (attributeIndex === -1) {
          return "";
        }

        const valueStart = attributeIndex + marker.length;
        const quote = normalizedSource[valueStart];
        if (quote !== '"' && quote !== "'") {
          return "";
        }

        const valueEnd = normalizedSource.indexOf(quote, valueStart + 1);
        if (valueEnd === -1) {
          return "";
        }

        return normalizedSource.slice(valueStart + 1, valueEnd);
      };
      const matchRegex = (value: string, regex: RegExp) => regex.exec(value);

      const preLanguageMatch =
        matchRegex(String(preAttrs), /data-language=["']([^"']+)["']/i) ||
        matchRegex(String(preAttrs), /data-lang=["']([^"']+)["']/i);
      const codeClassValue = extractAttributeValue(String(codeAttrs), "class");
      const codeLanguageFromClass = codeClassValue
        .split(/\s+/)
        .find((className) => className.startsWith("language-"))
        ?.slice("language-".length);
      const codeLanguageMatch =
        matchRegex(String(codeAttrs), /data-language=["']([^"']+)["']/i) ||
        matchRegex(String(codeAttrs), /data-lang=["']([^"']+)["']/i);
      const language = (
        preLanguageMatch?.[1] ||
        codeLanguageMatch?.[1] ||
        codeLanguageFromClass ||
        "plaintext"
      ).toLowerCase();
      const withClass = codeAttrs.includes("class=")
        ? codeAttrs.replace(
            /class=["'](.*?)["']/,
            'class="$1 macos-code-content"',
          )
        : `${codeAttrs} class="macos-code-content"`;
      return `<div class="macos-mockup" data-language="${language}"><div class="macos-titlebar"><div class="macos-window-dots" aria-hidden="true"><span class="macos-dot macos-dot-red"></span><span class="macos-dot macos-dot-yellow"></span><span class="macos-dot macos-dot-green"></span></div><div class="macos-window-actions"><span class="macos-language">${language}</span><button class="copy-code-btn" type="button" aria-label="Copy code">Copy</button></div></div><div class="code-wrapper-scroll"><pre><code${withClass}>${content}</code></pre></div></div>`;
    },
  );
}
