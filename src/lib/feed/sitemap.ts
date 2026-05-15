import type { ContentType, RenderedItem } from "@/types/content.ts";
import { escapeXml, joinSiteUrl } from "./url.ts";

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

export interface SitemapInput {
  notes: ReadonlyArray<Pick<RenderedItem, "slug" | "frontmatter">>;
  glossary: ReadonlyArray<Pick<RenderedItem, "slug" | "frontmatter">>;
  books: ReadonlyArray<Pick<RenderedItem, "slug" | "frontmatter">>;
}

const ROUTE_PREFIX: Record<ContentType, string> = {
  notes: "notes",
  glossary: "glossary",
  books: "books",
};

export function buildSitemapEntries(input: SitemapInput, siteUrl: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [
    { loc: joinSiteUrl(siteUrl, "/") },
    { loc: joinSiteUrl(siteUrl, "/notes") },
    { loc: joinSiteUrl(siteUrl, "/glossary") },
    { loc: joinSiteUrl(siteUrl, "/books") },
  ];
  pushType(entries, input.notes, "notes", siteUrl);
  pushType(entries, input.glossary, "glossary", siteUrl);
  pushType(entries, input.books, "books", siteUrl);
  return entries;
}

function pushType(
  entries: SitemapEntry[],
  items: ReadonlyArray<Pick<RenderedItem, "slug" | "frontmatter">>,
  type: ContentType,
  siteUrl: string,
): void {
  const sorted = items.toSorted((a, b) => {
    const au = a.frontmatter.updated ?? "";
    const bu = b.frontmatter.updated ?? "";
    if (au === bu) return a.slug.localeCompare(b.slug);
    return au < bu ? 1 : -1;
  });
  for (const item of sorted) {
    const loc = joinSiteUrl(siteUrl, `/${ROUTE_PREFIX[type]}/${item.slug}`);
    const updated = item.frontmatter.updated;
    entries.push(updated ? { loc, lastmod: updated } : { loc });
  }
}

export function renderSitemapXml(entries: readonly SitemapEntry[]): string {
  const body = entries
    .map((entry) => {
      const lastmod =
        entry.lastmod === undefined ? "" : `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>\n`;
      return `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>\n${lastmod}  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}
