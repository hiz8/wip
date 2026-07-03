import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { FootnoteSection } from "@/components/content/FootnoteSection.tsx";
import type { BlogArticleDto } from "@/server/loaders.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  article: {
    // Marginalia (float) が前後の記事に流れ込まないよう記事境界で clear する
    clear: "both",
  },
  date: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
    marginBottom: space.s1,
  },
  tags: {
    display: "inline-block",
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s2,
  },
});

interface BlogArticleBlockProps {
  article: BlogArticleDto;
}

// 「それ以外のタグ」クラスタリンク。ページ番号によって遷移先ルートの shape が
// 変わり `Link` の型が条件分岐に対応しないため、コンポーネントごと分岐する。
function OtherTagsLink({
  otherTags,
  anchorId,
}: {
  otherTags: NonNullable<BlogArticleDto["otherTags"]>;
  anchorId: string;
}) {
  const label = otherTags.labels.map((l) => `#${l}`).join("");
  const tagsetParams = useMemo(() => ({ tagset: otherTags.tagset }), [otherTags.tagset]);
  const pageParams = useMemo(
    () => ({ tagset: otherTags.tagset, n: String(otherTags.page) }),
    [otherTags.tagset, otherTags.page],
  );
  if (otherTags.page > 1) {
    return (
      <Link
        to="/blog/tags/$tagset/page/$n"
        params={pageParams}
        hash={anchorId}
        {...stylex.props(styles.tags)}
      >
        {label}
      </Link>
    );
  }
  return (
    <Link
      to="/blog/tags/$tagset"
      params={tagsetParams}
      hash={anchorId}
      {...stylex.props(styles.tags)}
    >
      {label}
    </Link>
  );
}

export function BlogArticleBlock({ article }: BlogArticleBlockProps) {
  const { otherTags } = article;
  const contentHtml = useMemo(() => ({ __html: article.html }), [article.html]);
  return (
    <article {...stylex.props(styles.article)} data-blog-article>
      {/* 作成日を見出しにする: 記事アンカーの対象 + Pagefind sub-result の分割点 */}
      <h2 id={article.anchorId} {...stylex.props(styles.date)}>
        {article.displayDate}
      </h2>
      {otherTags && <OtherTagsLink otherTags={otherTags} anchorId={article.anchorId} />}
      {article.isCanonicalPage ? (
        <div data-content-body data-pagefind-body dangerouslySetInnerHTML={contentHtml} />
      ) : (
        <div data-content-body dangerouslySetInnerHTML={contentHtml} />
      )}
      <FootnoteSection footnotes={article.footnotes} idPrefix={article.idPrefix} />
    </article>
  );
}
