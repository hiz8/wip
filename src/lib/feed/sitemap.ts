import type { ContentType, RenderedItem } from "@/types/content.ts";
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";
import { escapeXml, joinSiteUrl } from "./url.ts";

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
}

type SitemapItem = Pick<RenderedItem, "slug" | "frontmatter">;

export interface SitemapInput {
  notes: ReadonlyArray<SitemapItem>;
  glossary: ReadonlyArray<SitemapItem>;
  books: ReadonlyArray<SitemapItem>;
}

const compareSitemapItemUpdatedDesc = compareByUpdatedDesc<SitemapItem>(
  (item) => item.frontmatter.updated ?? "",
  (item) => item.slug,
);

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
  items: ReadonlyArray<SitemapItem>,
  type: ContentType,
  siteUrl: string,
): void {
  const sorted = items.toSorted(compareSitemapItemUpdatedDesc);
  for (const item of sorted) {
    const loc = joinSiteUrl(siteUrl, `/${type}/${item.slug}`);
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
