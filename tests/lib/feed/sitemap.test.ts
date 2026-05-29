import { describe, expect, it } from "vitest";
import { buildSitemapEntries, renderSitemapXml } from "@/lib/feed/sitemap.ts";

const SITE = "https://example.com";

const item = (
  type: "notes" | "glossary" | "books",
  slug: string,
  updated?: string,
  tags?: string[],
) => ({
  type,
  slug,
  frontmatter: {
    ...(updated === undefined ? {} : { updated }),
    ...(tags === undefined ? {} : { tags }),
  },
});

describe("buildSitemapEntries", () => {
  it("emits the four root routes first", () => {
    const entries = buildSitemapEntries({ notes: [], glossary: [], books: [] }, SITE);
    expect(entries.slice(0, 4).map((e) => e.loc)).toEqual([
      "https://example.com/",
      "https://example.com/notes",
      "https://example.com/glossary",
      "https://example.com/books",
    ]);
    for (const entry of entries) {
      expect(entry.lastmod).toBeUndefined();
    }
  });

  it("always emits the per-type tag index pages", () => {
    const entries = buildSitemapEntries({ notes: [], glossary: [], books: [] }, SITE);
    const locs = entries.map((e) => e.loc);
    expect(locs).toContain("https://example.com/notes/tags");
    expect(locs).toContain("https://example.com/glossary/tags");
    expect(locs).toContain("https://example.com/books/tags");
  });

  it("emits a tag-detail page per aggregated tag, with ancestors and slug escaping", () => {
    const entries = buildSitemapEntries(
      {
        notes: [item("notes", "a", "2026-05-01", ["frontend/react"])],
        glossary: [],
        books: [],
      },
      SITE,
    );
    const locs = entries.map((e) => e.loc);
    // 祖先が合成され、`/` が `--` にエスケープされる
    expect(locs).toContain("https://example.com/notes/tags/frontend");
    expect(locs).toContain("https://example.com/notes/tags/frontend--react");
  });

  it("orders detail entries by updated desc per type", () => {
    const entries = buildSitemapEntries(
      {
        notes: [
          item("notes", "old", "2026-01-01"),
          item("notes", "new", "2026-05-01"),
          item("notes", "mid", "2026-03-01"),
        ],
        glossary: [],
        books: [],
      },
      SITE,
    );
    const noteLocs = entries
      .filter((e) => e.loc.includes("/notes/") && !e.loc.includes("/tags"))
      .map((e) => e.loc);
    expect(noteLocs).toEqual([
      "https://example.com/notes/new",
      "https://example.com/notes/mid",
      "https://example.com/notes/old",
    ]);
  });

  it("omits lastmod when frontmatter has no updated", () => {
    const entries = buildSitemapEntries(
      {
        notes: [],
        glossary: [item("glossary", "term-a")],
        books: [],
      },
      SITE,
    );
    const target = entries.find((e) => e.loc.endsWith("/glossary/term-a"));
    expect(target).toBeDefined();
    expect(target?.lastmod).toBeUndefined();
  });

  it("encodes non-ascii slugs", () => {
    const entries = buildSitemapEntries(
      {
        notes: [item("notes", "日本語スラッグ", "2026-05-01")],
        glossary: [],
        books: [],
      },
      SITE,
    );
    const target = entries.find((e) => e.loc.includes("/notes/"));
    expect(target).toBeDefined();
    expect(target?.loc).toBe(`https://example.com/notes/${encodeURIComponent("日本語スラッグ")}`);
  });

  it("trims a trailing slash on siteUrl", () => {
    const entries = buildSitemapEntries(
      { notes: [item("notes", "a", "2026-05-01")], glossary: [], books: [] },
      "https://example.com/",
    );
    expect(entries[0]?.loc).toBe("https://example.com/");
    const detail = entries.find((e) => e.loc.endsWith("/notes/a"));
    expect(detail?.loc).toBe("https://example.com/notes/a");
  });
});

describe("renderSitemapXml", () => {
  it("emits a urlset envelope and per-entry url blocks", () => {
    const xml = renderSitemapXml([
      { loc: "https://example.com/" },
      { loc: "https://example.com/notes/a", lastmod: "2026-05-01" },
    ]);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain("<loc>https://example.com/</loc>");
    expect(xml).toContain("<loc>https://example.com/notes/a</loc>");
    expect(xml).toContain("<lastmod>2026-05-01</lastmod>");
    expect(xml).toContain("</urlset>");
  });

  it("does not emit lastmod when omitted", () => {
    const xml = renderSitemapXml([{ loc: "https://example.com/" }]);
    expect(xml).not.toContain("<lastmod>");
  });
});
