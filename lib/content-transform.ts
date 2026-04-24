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

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u00C0-\u024f\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeContentHeadings(
  html: string,
): HeadingNormalizationResult {
  if (typeof window === "undefined" || !html.trim()) {
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
  return primaryContent
    .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "")
    .replace(
      /<pre([^>]*)>\s*<code([^>]*)>([\s\S]*?)<\/code>\s*<\/pre>/gi,
      (_m, preAttrs, codeAttrs, content) => {
        const extractAttributeValue = (
          source: string,
          attributeName: string,
        ) => {
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
        const codeClassValue = extractAttributeValue(
          String(codeAttrs),
          "class",
        );
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
              'class="$1 !bg-transparent !p-0 !text-code-text !border-none !shadow-none"',
            )
          : `${codeAttrs} class="!bg-transparent !p-0 !text-code-text !border-none !shadow-none"`;
        return `<div class="macos-mockup relative rounded-xl overflow-hidden bg-code-bg my-8 shadow-xl border border-code-border font-mono group"><div class="flex items-center justify-between pl-4 pr-3 py-2 bg-code-header border-b border-code-border"><div class="flex gap-2"><div class="size-3 rounded-full bg-dot-red"></div><div class="size-3 rounded-full bg-dot-yellow"></div><div class="size-3 rounded-full bg-dot-green"></div></div><div class="flex items-center gap-3"><span class="text-[11px] font-semibold uppercase tracking-[0.18em] text-code-label">${language}</span><button class="copy-code-btn flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-code-muted hover:text-white transition-colors text-[13px] font-semibold border border-white/5 opacity-0 group-hover:opacity-100 focus:opacity-100">Copy</button></div></div><div class="code-wrapper-scroll overflow-x-auto text-[13px] sm:text-sm leading-relaxed whitespace-pre font-mono text-code-text"><pre class="!bg-transparent !m-0 !p-5 !shadow-none !rounded-none !border-none"><code${withClass}>${content}</code></pre></div></div>`;
      },
    );
}
