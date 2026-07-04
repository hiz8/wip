import { describe, expect, it } from "vitest";
import { buildBlogFeedEntries, buildBlogSitemapPages } from "@/lib/feed/index.ts";
import { enumerateFacetPages } from "@/lib/blog/pages.ts";
import { buildBlogTagTree } from "@/lib/blog/tree.ts";
import {
  articleFacets,
  blogArticleTitle,
  canonicalFullFacetSet,
  encodeTagset,
} from "@/lib/blog/tagset.ts";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";
import type { BlogArticleModel, BlogModel } from "@/server/blog.ts";

const SITE = "https://example.com";

interface Def {
  slug: string;
  tags: string[];
  updated: string;
}

// server キャッシュに依存せず、純関数の組み合わせで BlogModel を手組みする
function makeModel(defs: readonly Def[]): BlogModel {
  const articles: BlogArticleModel[] = defs
    .map((d) => {
      const date = parseBlogSlugDate(d.slug, "+09:00")!;
      return {
        slug: d.slug,
        anchorId: date.anchorId,
        displayDate: date.displayDate,
        createdIso: date.createdIso,
        updated: d.updated,
        tokens: d.tags,
        facetSet: new Set(articleFacets(d.tags)),
        canonicalTagset: encodeTagset(canonicalFullFacetSet(d.tags)),
        title: blogArticleTitle(d.tags),
        html: "<p>本文テキスト</p>",
        footnotes: [],
      };
    })
    .toSorted((a, b) => (a.slug < b.slug ? 1 : -1));
  const inputs = articles.map((a) => ({ slug: a.slug, tags: a.tokens }));
  return {
    articles,
    bySlug: new Map(articles.map((a) => [a.slug, a])),
    pages: enumerateFacetPages(inputs),
    tree: buildBlogTagTree(inputs),
  };
}

const twoArticles: Def[] = [
  {
    slug: "2025-12-11 0930",
    tags: ["UI-UX", "マイクロコピー"],
    updated: "2025-12-20T10:00:00+09:00",
  },
  { slug: "2025-02-14 0930", tags: ["映画"], updated: "2025-02-14T09:30:00+09:00" },
];

describe("buildBlogFeedEntries", () => {
  it("作成日時降順・タグ併記タイトル・正規ページ + アンカーの link を生成する", () => {
    const entries = buildBlogFeedEntries(makeModel(twoArticles), SITE, 20);
    expect(entries).toHaveLength(2);
    expect(entries[0]!.title).toBe("#UI-UX#マイクロコピー");
    expect(entries[0]!.href).toBe(
      `${SITE}/blog/tags/${encodeURIComponent("UI-UX+マイクロコピー")}#p-2025-12-11-0930`,
    );
    expect(entries[0]!.published).toBe("2025-12-11T09:30:00+09:00");
    // updated は toIsoInstant で UTC instant に正規化される (published は正規化しない)
    expect(entries[0]!.updated).toBe("2025-12-20T01:00:00.000Z");
  });

  it("maxItems で切り詰める", () => {
    expect(buildBlogFeedEntries(makeModel(twoArticles), SITE, 1)).toHaveLength(1);
  });
});

describe("buildBlogSitemapPages", () => {
  it("/blog と全 tagset ページを列挙し、lastmod は掲載記事の updated 最大値", () => {
    const pages = buildBlogSitemapPages(makeModel(twoArticles));
    const paths = pages.map((p) => p.path);
    expect(paths).toContain("/blog");
    expect(paths).toContain("/blog/tags/映画");
    expect(pages.find((p) => p.path === "/blog")!.lastmod).toBe("2025-12-20T10:00:00+09:00");
  });

  it("11 件以上の集合にはページネーション URL を含め、lastmod はページごとに計算する", () => {
    // slug 降順の 2 ページ目 = 最古の 2 slug (01/02 日)。ここにだけ最新 updated を置き、
    // page1 (古い) と page2 (最新) の lastmod が別値になることで集約バグを検出する。
    const many: Def[] = Array.from({ length: 12 }, (_, i) => {
      const day = String(i + 1).padStart(2, "0");
      const onLastPage = day === "01" || day === "02";
      return {
        slug: `2025-01-${day} 0900`,
        tags: ["映画"],
        updated: onLastPage ? "2025-06-01T00:00:00+09:00" : "2025-03-01T00:00:00+09:00",
      };
    });
    const pages = buildBlogSitemapPages(makeModel(many));
    const at = (path: string) => pages.find((p) => p.path === path);

    const paths = pages.map((p) => p.path);
    expect(paths).toContain("/blog/page/2");
    expect(paths).toContain("/blog/tags/映画/page/2");
    expect(paths).not.toContain("/blog/page/1");

    // 各ページの lastmod はそのページ掲載記事の updated 最大値 (ページ間で異なる)
    expect(at("/blog")!.lastmod).toBe("2025-03-01T00:00:00+09:00");
    expect(at("/blog/page/2")!.lastmod).toBe("2025-06-01T00:00:00+09:00");
    expect(at("/blog")!.lastmod).not.toBe(at("/blog/page/2")!.lastmod);
    expect(at("/blog/tags/映画")!.lastmod).toBe("2025-03-01T00:00:00+09:00");
    expect(at("/blog/tags/映画/page/2")!.lastmod).toBe("2025-06-01T00:00:00+09:00");
  });
});
