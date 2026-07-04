import { describe, expect, it } from "vitest";
import { buildAtomEntries, renderAtomXml } from "@/lib/feed/atom.ts";
import type { RenderedItem } from "@/types/content.ts";

const SITE = "https://example.com";

interface MakeOptions {
  type: "notes" | "glossary" | "books";
  slug: string;
  title: string;
  updated?: string;
  summary?: string;
  html?: string;
}

const make = (options: MakeOptions): RenderedItem => {
  const { type, slug, title, updated, summary, html = "<p>body</p>" } = options;
  const frontmatter: Record<string, unknown> = {};
  if (updated !== undefined) frontmatter["updated"] = updated;
  if (summary !== undefined) frontmatter["summary"] = summary;
  return {
    type,
    slug,
    filePath: `${slug}.md`,
    absolutePath: `/vault/${slug}.md`,
    frontmatter: frontmatter as RenderedItem["frontmatter"],
    body: "",
    html,
    title,
    toc: [],
    outgoingLinks: [],
    incomingLinks: [],
    footnotes: [],
    callouts: [],
    images: [],
  };
};

describe("buildAtomEntries", () => {
  it("merges all types and orders by updated desc", () => {
    const entries = buildAtomEntries(
      {
        notes: [make({ type: "notes", slug: "n1", title: "Note 1", updated: "2026-04-01" })],
        glossary: [make({ type: "glossary", slug: "g1", title: "Term 1", updated: "2026-05-01" })],
        books: [make({ type: "books", slug: "9784", title: "Book 1", updated: "2026-03-01" })],
      },
      SITE,
      20,
    );
    expect(entries.map((e) => e.id)).toEqual([
      "https://example.com/glossary/g1",
      "https://example.com/notes/n1",
      "https://example.com/books/9784",
    ]);
  });

  it("drops items without updated", () => {
    const entries = buildAtomEntries(
      {
        notes: [
          make({ type: "notes", slug: "with-date", title: "Has Date", updated: "2026-05-01" }),
          make({ type: "notes", slug: "no-date", title: "No Date" }),
        ],
        glossary: [],
        books: [],
      },
      SITE,
      20,
    );
    expect(entries.map((e) => e.id)).toEqual(["https://example.com/notes/with-date"]);
  });

  it("truncates to maxItems", () => {
    const notes = Array.from({ length: 30 }, (_, i) =>
      make({
        type: "notes",
        slug: `n${i}`,
        title: `Note ${i}`,
        updated: `2026-05-${String(i + 1).padStart(2, "0")}`,
      }),
    );
    const entries = buildAtomEntries({ notes, glossary: [], books: [] }, SITE, 10);
    expect(entries).toHaveLength(10);
    expect(entries[0]?.id).toBe("https://example.com/notes/n29");
  });

  it("prefers frontmatter.summary for the entry summary", () => {
    const entries = buildAtomEntries(
      {
        notes: [
          make({
            type: "notes",
            slug: "n1",
            title: "Note 1",
            updated: "2026-05-01",
            summary: "explicit summary",
            html: "<p>ignored</p>",
          }),
        ],
        glossary: [],
        books: [],
      },
      SITE,
      20,
    );
    expect(entries[0]?.summary).toBe("explicit summary");
  });

  it("normalizes date-only updated to T00:00:00Z", () => {
    const entries = buildAtomEntries(
      {
        notes: [make({ type: "notes", slug: "n1", title: "Note 1", updated: "2026-05-01" })],
        glossary: [],
        books: [],
      },
      SITE,
      20,
    );
    expect(entries[0]?.updated).toBe("2026-05-01T00:00:00Z");
  });
});

describe("renderAtomXml", () => {
  const site = {
    siteUrl: SITE,
    siteName: "Digital Garden",
    description: "Test feed",
    selfHref: "https://example.com/feed.xml",
    language: "ja",
  };

  it("wraps entries in a feed envelope with self and alternate links", () => {
    const xml = renderAtomXml(site, [
      {
        id: "https://example.com/notes/a",
        title: "Title",
        updated: "2026-05-01T00:00:00Z",
        href: "https://example.com/notes/a",
        summary: "Summary",
      },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">');
    expect(xml).toContain("<title>Digital Garden</title>");
    expect(xml).toContain('rel="self"');
    expect(xml).toContain('rel="alternate"');
    expect(xml).toContain("<entry>");
    expect(xml).toContain("<title>Title</title>");
    expect(xml).toContain("</feed>");
  });

  it("escapes special characters in entry fields", () => {
    const xml = renderAtomXml(site, [
      {
        id: "https://example.com/notes/a",
        title: "A & B <hello>",
        updated: "2026-05-01T00:00:00Z",
        href: "https://example.com/notes/a",
        summary: "x < y & y > z",
      },
    ]);
    expect(xml).toContain("<title>A &amp; B &lt;hello&gt;</title>");
    expect(xml).toContain('<summary type="text">x &lt; y &amp; y &gt; z</summary>');
  });

  it("emits <published> only when the entry provides it", () => {
    const withPublished = renderAtomXml(site, [
      {
        id: "https://example.com/blog/a",
        title: "A",
        updated: "2026-05-10T00:00:00Z",
        published: "2026-05-01T09:00:00+09:00",
        href: "https://example.com/blog/a",
        summary: "",
      },
    ]);
    expect(withPublished).toContain("<published>2026-05-01T09:00:00+09:00</published>");

    const withoutPublished = renderAtomXml(site, [
      {
        id: "https://example.com/notes/a",
        title: "A",
        updated: "2026-05-10T00:00:00Z",
        href: "https://example.com/notes/a",
        summary: "",
      },
    ]);
    expect(withoutPublished).not.toContain("<published>");
  });

  it("uses the latest entry updated as the feed-level updated", () => {
    const xml = renderAtomXml(site, [
      {
        id: "https://example.com/notes/a",
        title: "A",
        updated: "2026-05-10T00:00:00Z",
        href: "https://example.com/notes/a",
        summary: "",
      },
      {
        id: "https://example.com/notes/b",
        title: "B",
        updated: "2026-05-05T00:00:00Z",
        href: "https://example.com/notes/b",
        summary: "",
      },
    ]);
    const match = xml.match(/<updated>([^<]+)<\/updated>/u);
    expect(match?.[1]).toBe("2026-05-10T00:00:00Z");
  });
});
