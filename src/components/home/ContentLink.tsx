import { useMemo, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { ContentType } from "@/types/content.ts";
import { colors, typography } from "@/styles/tokens.stylex.ts";

interface ContentLinkProps {
  type: ContentType;
  slug: string;
  /** type === "blog" のとき必須。記事の全ファセット集合ページ + アンカーへのリンク情報 */
  blogLink?: { tagset: string; page: number; anchorId: string };
  /** 指定すると既定のインラインリンク装飾を置き換える (マージしない)。 */
  style?: StyleXStyles;
  children: ReactNode;
}

const styles = stylex.create({
  link: {
    color: colors.link,
    fontWeight: typography.weightSemibold,
    textDecoration: { default: "none", ":hover": "underline" },
  },
});

interface BlogContentLinkProps {
  blogLink: NonNullable<ContentLinkProps["blogLink"]>;
  style?: StyleXStyles;
  children: ReactNode;
}

// ページ番号によって遷移先ルートの shape が変わり Link の型が条件分岐に対応しない
// ため、コンポーネントごと分岐する (BlogArticleBlock.tsx の OtherTagsLink と同じ方針)。
function BlogContentLink({ blogLink, style, children }: BlogContentLinkProps) {
  const linkProps = stylex.props(style ?? styles.link);
  const tagsetParams = useMemo(() => ({ tagset: blogLink.tagset }), [blogLink.tagset]);
  const pageParams = useMemo(
    () => ({ tagset: blogLink.tagset, n: String(blogLink.page) }),
    [blogLink.tagset, blogLink.page],
  );
  if (blogLink.page > 1) {
    return (
      <Link
        to="/blog/tags/$tagset/page/$n"
        params={pageParams}
        hash={blogLink.anchorId}
        {...linkProps}
      >
        {children}
      </Link>
    );
  }
  return (
    <Link to="/blog/tags/$tagset" params={tagsetParams} hash={blogLink.anchorId} {...linkProps}>
      {children}
    </Link>
  );
}

// type に応じて適切な詳細ルートへリンクする。router params は型安全に保つため
// (href 文字列を作らず) ここで出し分ける。Backlinks.tsx と同じ方針。
export function ContentLink({ type, slug, blogLink, style, children }: ContentLinkProps) {
  const linkProps = stylex.props(style ?? styles.link);
  // notes/glossary は { slug }、books は { isbn } を要求する。両キーを持つ 1 つの
  // オブジェクトはどちらの params 型とも構造的に互換なので、memo は 1 回で足りる
  // (react-perf の object-as-prop ルールを満たしつつ毎 render の二重生成を避ける)。
  const params = useMemo(() => ({ slug, isbn: slug }), [slug]);
  if (type === "blog") {
    // blogLink は type === "blog" のとき呼び出し元 (HomeRecentItem) が必ず設定する。
    if (!blogLink) return null;
    return (
      <BlogContentLink blogLink={blogLink} style={style}>
        {children}
      </BlogContentLink>
    );
  }
  if (type === "notes") {
    return (
      <Link to="/notes/$slug" params={params} {...linkProps}>
        {children}
      </Link>
    );
  }
  if (type === "glossary") {
    return (
      <Link to="/glossary/$slug" params={params} {...linkProps}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/books/$isbn" params={params} {...linkProps}>
      {children}
    </Link>
  );
}
