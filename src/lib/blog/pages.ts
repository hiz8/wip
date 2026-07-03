import { tagAncestors } from "@/lib/tags/index.ts";
import { canonicalizeFacetSet, compareCodePoints, encodeTagset } from "./tagset.ts";

// ファセット集合ページの列挙と、ビルド時のリンク先算出 (docs/blog-spec.md「URL 構造」)。
// 生成対象 = 「S を部分集合として含む公開記事が 1 件以上存在する antichain S」。
// 列挙は記事ごとに「各トークンを (含めない / 根まで / フルパス) のいずれかで採用」した
// 組み合わせを canonical 化する方式を取る。トークン最大 4 なので高々 3^4 - 1 通り/記事。

export interface BlogFacetInput {
  slug: string;
  tags: readonly string[];
}

export interface FacetPage {
  tagset: string;
  facets: string[];
  /** 作成日時降順 (slug は固定幅の日時フォーマットのため文字列降順でよい) */
  slugs: string[];
}

export const BLOG_PAGE_SIZE = 10;

export function enumerateFacetPages(articles: readonly BlogFacetInput[]): Map<string, FacetPage> {
  const pages = new Map<string, FacetPage>();

  for (const article of articles) {
    const perToken = article.tags.map(
      (token) => [null, ...tagAncestors(token)] as (string | null)[],
    );
    for (const combo of cartesian(perToken)) {
      const chosen = combo.filter((f): f is string => f !== null);
      if (chosen.length === 0) continue;
      const facets = canonicalizeFacetSet(chosen);
      const tagset = encodeTagset(facets);
      let page = pages.get(tagset);
      if (!page) {
        page = { tagset, facets, slugs: [] };
        pages.set(tagset, page);
      }
      if (!page.slugs.includes(article.slug)) page.slugs.push(article.slug);
    }
  }

  for (const page of pages.values()) {
    page.slugs = page.slugs.toSorted((a, b) => compareCodePoints(b, a));
  }
  return pages;
}

function cartesian<T>(lists: readonly T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])),
    [[]],
  );
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
}

export function pageSlice<T>(items: readonly T[], page: number): T[] {
  return items.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);
}

export interface BlogLinkTarget {
  tagset: string;
  /** 1 なら base URL (/page/1 は生成しない) */
  page: number;
}

// 遷移先で対象記事が 2 ページ目以降にある場合もアンカーへ正しく着地させるため、
// リンク先のページ番号はビルド時に算出する (docs/blog-spec.md「リンク遷移ルール」)。
export function locateArticle(
  pages: ReadonlyMap<string, FacetPage>,
  tagset: string,
  slug: string,
): BlogLinkTarget | null {
  const page = pages.get(tagset);
  if (!page) return null;
  const index = page.slugs.indexOf(slug);
  if (index === -1) return null;
  return { tagset, page: Math.floor(index / BLOG_PAGE_SIZE) + 1 };
}

export interface RemainingToken {
  token: string;
  /** 表示ラベル: 現在ページが親ファセットを含む階層タグは残りセグメントのみ */
  label: string;
}

export function remainingTokens(
  tokens: readonly string[],
  pageFacets: readonly string[],
): RemainingToken[] {
  const page = new Set(pageFacets);
  const result: RemainingToken[] = [];
  for (const token of tokens) {
    // トークン自体が指定済み
    if (page.has(token)) continue;
    // 現在ページに含まれる最長の祖先ファセット分を表示から省く
    const covered = tagAncestors(token)
      .filter((a) => a !== token && page.has(a))
      .toSorted((a, b) => b.length - a.length)[0];
    result.push({ token, label: covered ? token.slice(covered.length + 1) : token });
  }
  return result.toSorted((a, b) => compareCodePoints(a.token, b.token));
}
