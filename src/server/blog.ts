import type { FootnoteEntry } from "@/types/content.ts";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";
import {
  articleFacets,
  canonicalFullFacetSet,
  canonicalTagsetOf,
  decodeTagset,
  encodeTagset,
} from "@/lib/blog/tagset.ts";
import {
  enumerateFacetPages,
  locateArticle,
  pageCount,
  pageSlice,
  remainingTokens,
  type FacetPage,
} from "@/lib/blog/pages.ts";
import { buildBlogTagTree, type BlogTreeNode } from "@/lib/blog/tree.ts";
import { getResolvedConfig, getSiteDataset } from "./datasets.ts";

export interface BlogArticleModel {
  slug: string;
  anchorId: string;
  displayDate: string;
  createdIso: string;
  updated: string;
  tokens: string[];
  facetSet: ReadonlySet<string>;
  /** この記事の全ファセット集合ページ (最も特定的な正規ページ) の tagset */
  canonicalTagset: string;
  title: string;
  html: string;
  footnotes: FootnoteEntry[];
}

export interface BlogModel {
  articles: BlogArticleModel[];
  bySlug: Map<string, BlogArticleModel>;
  pages: Map<string, FacetPage>;
  tree: BlogTreeNode[];
}

// dataset と同じライフサイクルで memoize する。dataset キャッシュが破棄されたときに
// 追従できるよう、素の dataset 参照をキーに持つ。
let cached: { source: unknown; model: BlogModel } | null = null;

export async function getBlogModel(): Promise<BlogModel> {
  const dataset = await getSiteDataset();
  if (cached && cached.source === dataset) return cached.model;

  const config = getResolvedConfig();
  const timezone = config.content.blog.timezone;

  const articles: BlogArticleModel[] = dataset.blog.map((item) => {
    const date = parseBlogSlugDate(item.slug, timezone)!;
    const tokens = item.frontmatter.tags;
    return {
      slug: item.slug,
      anchorId: date.anchorId,
      displayDate: date.displayDate,
      createdIso: date.createdIso,
      updated: item.frontmatter.updated,
      tokens,
      facetSet: new Set(articleFacets(tokens)),
      canonicalTagset: encodeTagset(canonicalFullFacetSet(tokens)),
      title: item.title,
      html: item.html,
      footnotes: item.footnotes,
    };
  });

  const inputs = articles.map((a) => ({ slug: a.slug, tags: a.tokens }));
  const model: BlogModel = {
    articles,
    bySlug: new Map(articles.map((a) => [a.slug, a])),
    pages: enumerateFacetPages(inputs),
    tree: buildBlogTagTree(inputs),
  };
  cached = { source: dataset, model };
  return model;
}

export interface BlogArticleDto {
  slug: string;
  anchorId: string;
  displayDate: string;
  html: string;
  footnotes: FootnoteEntry[];
  /** FootnoteSection の id 名前空間 (= `${anchorId}-`) */
  idPrefix: string;
  /** 現在ページがこの記事の全ファセット集合ページか (Pagefind のインデックス対象) */
  isCanonicalPage: boolean;
  /** それ以外のタグ (クラスタで 1 リンク)。該当なしは null */
  otherTags: { labels: string[]; tagset: string; page: number } | null;
}

export interface BlogListPageDto {
  /** null = トップページ (/blog) */
  tagset: string | null;
  facets: string[];
  pageTitle: string | null;
  breadcrumb: { label: string; tagset: string }[];
  page: number;
  totalPages: number;
  articles: BlogArticleDto[];
}

// トップ (tagset = null) とタグ詳細を同じ射影で扱う。
// 非正規 tagset・未知の集合・範囲外ページは null (ルート側で notFound)。
export function projectBlogListPage(
  model: BlogModel,
  tagset: string | null,
  page: number,
): BlogListPageDto | null {
  let facets: string[] = [];
  let slugs: string[];

  if (tagset === null) {
    slugs = model.articles.map((a) => a.slug);
  } else {
    // 非正規な tagset は 404 (ルート側で notFound)
    if (canonicalTagsetOf(decodeTagset(tagset)) !== tagset) return null;
    const facetPage = model.pages.get(tagset);
    if (!facetPage) return null;
    facets = facetPage.facets;
    slugs = facetPage.slugs;
  }

  const totalPages = pageCount(slugs.length);
  if (!Number.isInteger(page) || page < 1 || page > totalPages) return null;

  const articles = pageSlice(slugs, page).map((slug) => {
    const article = model.bySlug.get(slug)!;
    const remaining = remainingTokens(article.tokens, facets);
    let otherTags: BlogArticleDto["otherTags"] = null;
    if (remaining.length > 0) {
      // 遷移先 = canonical(P ∪ R)。トークンを facet として足せば冗長祖先は正規化で落ちる
      const target = canonicalTagsetOf([...facets, ...remaining.map((r) => r.token)]);
      const located = locateArticle(model.pages, target, slug)!;
      otherTags = { labels: remaining.map((r) => r.label), tagset: target, page: located.page };
    }
    return {
      slug: article.slug,
      anchorId: article.anchorId,
      displayDate: article.displayDate,
      html: article.html,
      footnotes: article.footnotes,
      idPrefix: `${article.anchorId}-`,
      isCanonicalPage: tagset !== null && tagset === article.canonicalTagset,
      otherTags,
    };
  });

  // パンくず: 累積正規チェーン (正規リストの先頭からの部分列は常に正規形)
  const breadcrumb = facets.map((_, i) => {
    const subset = facets.slice(0, i + 1);
    return {
      label: subset.map((f) => `#${f}`).join(""),
      tagset: encodeTagset(subset),
    };
  });

  return {
    tagset,
    facets,
    pageTitle: tagset === null ? null : facets.map((f) => `#${f}`).join(""),
    breadcrumb,
    page,
    totalPages,
    articles,
  };
}

export function __resetBlogModelForTests(): void {
  cached = null;
}
