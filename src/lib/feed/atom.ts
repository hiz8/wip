import type { ContentType, RenderedItem } from "@/types/content.ts";
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";
import { extractFeedSummary } from "./summary.ts";
import { escapeXml, joinSiteUrl } from "./url.ts";

export interface FeedEntry {
  id: string;
  title: string;
  updated: string;
  /** 作成日時 (frontmatter に created を持たない Blog 向け)。省略時は <published> を出力しない */
  published?: string;
  href: string;
  summary: string;
}

export interface FeedSiteInfo {
  siteUrl: string;
  siteName: string;
  description: string;
  selfHref: string;
  language?: string;
}

export interface FeedInput {
  notes: ReadonlyArray<RenderedItem>;
  glossary: ReadonlyArray<RenderedItem>;
  books: ReadonlyArray<RenderedItem>;
}

interface FeedSource {
  type: ContentType;
  item: RenderedItem;
}

const compareFeedSourceUpdatedDesc = compareByUpdatedDesc<FeedSource>(
  (s) => s.item.frontmatter.updated ?? "",
  (s) => s.item.slug,
);

export function buildAtomEntries(input: FeedInput, siteUrl: string, maxItems: number): FeedEntry[] {
  const sources: FeedSource[] = [
    ...input.notes.map((item) => ({ type: "notes" as const, item })),
    ...input.glossary.map((item) => ({ type: "glossary" as const, item })),
    ...input.books.map((item) => ({ type: "books" as const, item })),
  ];
  const withUpdated = sources.filter((s) => Boolean(s.item.frontmatter.updated));
  const sorted = withUpdated.toSorted(compareFeedSourceUpdatedDesc);
  const truncated = sorted.slice(0, maxItems);
  return truncated.map(({ type, item }) => {
    const href = joinSiteUrl(siteUrl, `/${type}/${item.slug}`);
    return {
      id: href,
      title: item.title,
      updated: toIsoInstant(item.frontmatter.updated ?? ""),
      href,
      summary: extractFeedSummary(item),
    };
  });
}

function toIsoInstant(value: string): string {
  if (value === "") return new Date(0).toISOString();
  if (/T.*Z$/u.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) return `${value}T00:00:00Z`;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString();
}

export function renderAtomXml(site: FeedSiteInfo, entries: readonly FeedEntry[]): string {
  const updated = entries[0]?.updated ?? new Date(0).toISOString();
  const langAttr = site.language === undefined ? "" : ` xml:lang="${escapeXml(site.language)}"`;
  const body = entries
    .map((entry) => {
      const published =
        entry.published === undefined
          ? ""
          : `    <published>${escapeXml(entry.published)}</published>\n`;
      return `  <entry>
    <title>${escapeXml(entry.title)}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(entry.href)}"/>
    <id>${escapeXml(entry.id)}</id>
${published}    <updated>${escapeXml(entry.updated)}</updated>
    <summary type="text">${escapeXml(entry.summary)}</summary>
  </entry>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"${langAttr}>
  <title>${escapeXml(site.siteName)}</title>
  <subtitle>${escapeXml(site.description)}</subtitle>
  <link rel="alternate" type="text/html" href="${escapeXml(site.siteUrl)}"/>
  <link rel="self" type="application/atom+xml" href="${escapeXml(site.selfHref)}"/>
  <id>${escapeXml(site.siteUrl)}</id>
  <updated>${escapeXml(updated)}</updated>
${body}
</feed>
`;
}
