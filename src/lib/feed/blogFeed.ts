import type { BlogModel } from "@/server/blog.ts";
import { locateArticle, pageCount, pageSlice } from "@/lib/blog/pages.ts";
import { extractSummaryFromHtml } from "./summary.ts";
import { toIsoInstant } from "./atom.ts";
import { joinSiteUrl } from "./url.ts";
import type { FeedEntry } from "./atom.ts";

// Blog 専用 Atom フィード (docs/blog-spec.md「フィード」)。
// エントリの link は「記事の全ファセット集合ページ (正規形) + 記事アンカー」。
// 対象記事が 2 ページ目以降にある場合も正しい /page/[n] を指す。
export function buildBlogFeedEntries(
  model: BlogModel,
  siteUrl: string,
  maxItems: number,
): FeedEntry[] {
  return model.articles.slice(0, maxItems).map((article) => {
    const located = locateArticle(model.pages, article.canonicalTagset, article.slug)!;
    const path =
      located.page > 1
        ? `/blog/tags/${article.canonicalTagset}/page/${located.page}`
        : `/blog/tags/${article.canonicalTagset}`;
    const href = `${joinSiteUrl(siteUrl, path)}#${article.anchorId}`;
    return {
      id: href,
      title: article.title,
      // updated は Notes 等の feed (atom.ts) と同様に RFC3339 instant へ正規化する。
      // published (createdIso) はファイル名由来で常に完全なため正規化しない。
      updated: toIsoInstant(article.updated),
      published: article.createdIso,
      href,
      summary: extractSummaryFromHtml(article.html),
    };
  });
}

export interface BlogSitemapPage {
  path: string;
  lastmod?: string;
}

// `/blog`、`/blog/tags/[tagset]` それぞれについて、ページネーション先頭
// (`/page/1` は生成しない) 以降の全ページを列挙する (docs/blog-spec.md「グローバル統合」)。
// lastmod は「そのページに掲載される記事の updated 最大値」なので、tagset 全体で
// 一括計算せずページ (pageSlice) ごとに求める。
export function buildBlogSitemapPages(model: BlogModel): BlogSitemapPage[] {
  const pages: BlogSitemapPage[] = [];
  const lastmodOf = (slugs: readonly string[]): string | undefined => {
    const updates = slugs.map((s) => model.bySlug.get(s)!.updated).toSorted();
    return updates.at(-1);
  };

  const pushPaginated = (basePath: string, slugs: readonly string[]) => {
    const total = pageCount(slugs.length);
    for (let n = 1; n <= total; n++) {
      const path = n === 1 ? basePath : `${basePath}/page/${n}`;
      const lastmod = lastmodOf(pageSlice(slugs, n));
      pages.push(lastmod ? { path, lastmod } : { path });
    }
  };

  pushPaginated(
    "/blog",
    model.articles.map((a) => a.slug),
  );
  for (const page of model.pages.values()) {
    pushPaginated(`/blog/tags/${page.tagset}`, page.slugs);
  }
  return pages;
}
