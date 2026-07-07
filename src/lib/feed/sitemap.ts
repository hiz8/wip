import type { ContentType, RenderedItem } from "@/types/content.ts";
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";
import { aggregateTags, encodeTagToSlug } from "@/lib/tags/index.ts";
import type { BlogSitemapPage } from "./blogFeed.ts";
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
  blogPages: ReadonlyArray<BlogSitemapPage>;
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
    { loc: joinSiteUrl(siteUrl, "/works") },
  ];
  pushType(entries, input.notes, "notes", siteUrl);
  pushType(entries, input.glossary, "glossary", siteUrl);
  pushType(entries, input.books, "books", siteUrl);
  pushTagPages(entries, input.notes, "notes", siteUrl);
  pushTagPages(entries, input.glossary, "glossary", siteUrl);
  pushTagPages(entries, input.books, "books", siteUrl);
  for (const page of input.blogPages) {
    const loc = joinSiteUrl(siteUrl, page.path);
    entries.push(page.lastmod ? { loc, lastmod: page.lastmod } : { loc });
  }
  return entries;
}

// タグ index ページ + 集計された各タグ (祖先を含む) ごとに 1 つのタグ詳細ページ。
function pushTagPages(
  entries: SitemapEntry[],
  items: ReadonlyArray<SitemapItem>,
  type: ContentType,
  siteUrl: string,
): void {
  entries.push({ loc: joinSiteUrl(siteUrl, `/${type}/tags`) });
  const tags = aggregateTags(items.map((item) => ({ tags: item.frontmatter.tags ?? [] })));
  for (const { tag } of tags) {
    entries.push({ loc: joinSiteUrl(siteUrl, `/${type}/tags/${encodeTagToSlug(tag)}`) });
  }
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
