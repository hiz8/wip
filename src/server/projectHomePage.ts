import type { ContentType } from "@/types/content.ts";
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";
import { locateArticle } from "@/lib/blog/pages.ts";
import { getBlogModel, type BlogModel } from "./blog.ts";
import { getResolvedConfig, getSiteDataset, type SiteDataset } from "./datasets.ts";

// このモジュールは Vault / config (node:fs) に依存するサーバ専用ロジックを保持する。
// `home.ts` の createServerFn handler からのみ参照させ、ルート (クライアント) からは
// import させないことで、dev でクライアントバンドルに node:fs が混入しないようにする。
// (詳しくは home.ts のコメントを参照)

// 最近更新セクションの表示件数 (docs/ui-spec.md:182)。
const RECENT_LIMIT = 5;

export interface HomeRecentItem {
  type: ContentType;
  slug: string;
  title: string;
  updated: string;
  /** type === "blog" のときのみ。記事の全ファセット集合ページ (正規形) + アンカーへのリンク情報 */
  blogLink?: { tagset: string; page: number; anchorId: string };
}

export interface HomeFeaturedItem {
  type: ContentType;
  slug: string;
  title: string;
  updated: string | null;
}

export interface HomeCounts {
  notes: number;
  glossary: number;
  books: number;
  blog: number;
}

export interface HomeSocialLink {
  label: string;
  url: string;
  icon?: string;
}

export interface HomePageData {
  introHtml: string | null;
  aboutHtml: string | null;
  recent: HomeRecentItem[];
  counts: HomeCounts;
  featured: HomeFeaturedItem[];
  socialLinks: HomeSocialLink[];
  /** スカイバナーのフッターに表示する著者名 (config.author.name)。 */
  authorName: string;
}

interface NormalizedItem {
  type: ContentType;
  slug: string;
  title: string;
  updated: string | null;
  featured: boolean;
  blogLink?: { tagset: string; page: number; anchorId: string };
}

// Notes / Glossary / Books / Blog を横断ソート・フィルタできる共通形へ正規化する。
// Glossary は updated を持たないことが多いため null 許容。Blog は featured を
// 持たないコンテンツタイプのため常に false とし (Featured 対象外)、代わりに
// リンク先算出用の blogLink を積む。
function normalizeAll(ds: SiteDataset, blogModel: BlogModel): NormalizedItem[] {
  const out: NormalizedItem[] = [];
  for (const n of ds.notes) {
    out.push({
      type: "notes",
      slug: n.slug,
      title: n.title,
      updated: n.frontmatter.updated ?? null,
      featured: n.frontmatter.featured ?? false,
    });
  }
  for (const g of ds.glossary) {
    out.push({
      type: "glossary",
      slug: g.slug,
      title: g.title,
      updated: g.frontmatter.updated ?? null,
      featured: g.frontmatter.featured ?? false,
    });
  }
  for (const b of ds.books) {
    out.push({
      type: "books",
      slug: b.slug,
      title: b.title,
      updated: b.frontmatter.updated ?? null,
      featured: b.frontmatter.featured ?? false,
    });
  }
  for (const a of blogModel.articles) {
    // 記事は自身の全ファセット集合ページ (canonicalTagset) に必ず列挙されるため
    // (enumerateFacetPages が各トークンのフルパスを採用する組み合わせを含む)、
    // locateArticle は常に見つかる。
    const located = locateArticle(blogModel.pages, a.canonicalTagset, a.slug)!;
    out.push({
      type: "blog",
      slug: a.slug,
      title: a.title,
      updated: a.updated,
      featured: false,
      blogLink: { tagset: located.tagset, page: located.page, anchorId: a.anchorId },
    });
  }
  return out;
}

// createServerFn の handler は inline でなければならないため、テスト可能な純ヘルパ
// として projection 本体を切り出す。
export async function projectHomePage(): Promise<HomePageData> {
  const ds = await getSiteDataset();
  const blogModel = await getBlogModel();
  const config = getResolvedConfig();
  const all = normalizeAll(ds, blogModel);

  // 最近更新: updated を持つものだけを横断し、updated 降順 上位 5 件。
  const recent: HomeRecentItem[] = all
    .filter(
      (it): it is NormalizedItem & { updated: string } => it.updated !== null && it.updated !== "",
    )
    .map((it) =>
      it.blogLink === undefined
        ? { type: it.type, slug: it.slug, title: it.title, updated: it.updated }
        : {
            type: it.type,
            slug: it.slug,
            title: it.title,
            updated: it.updated,
            blogLink: it.blogLink,
          },
    )
    .toSorted(
      compareByUpdatedDesc<HomeRecentItem>(
        (it) => it.updated,
        (it) => it.slug,
      ),
    )
    .slice(0, RECENT_LIMIT);

  // Featured: featured:true のみ。updated を持つものを降順、持たないものは
  // (updated ?? "" が最小値となり) 末尾へ。
  const featured: HomeFeaturedItem[] = all
    .filter((it) => it.featured)
    .map((it) => ({ type: it.type, slug: it.slug, title: it.title, updated: it.updated }))
    .toSorted(
      compareByUpdatedDesc<HomeFeaturedItem>(
        (it) => it.updated ?? "",
        (it) => it.slug,
      ),
    );

  const counts: HomeCounts = {
    notes: ds.notes.length,
    glossary: ds.glossary.length,
    books: ds.books.length,
    blog: ds.blog.length,
  };

  const socialLinks: HomeSocialLink[] = (config.author.socialLinks ?? []).map((link) =>
    link.icon === undefined
      ? { label: link.label, url: link.url }
      : { label: link.label, url: link.url, icon: link.icon },
  );

  return {
    introHtml: ds.siteContent.introHtml,
    aboutHtml: ds.siteContent.aboutHtml,
    recent,
    counts,
    featured,
    socialLinks,
    authorName: config.author.name,
  };
}
