import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { encodeTagToSlug } from "@/lib/tags/index.ts";
import type { ContentType } from "@/types/content.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface TagChipsProps {
  /** chip がリンクする、名前空間付きタグページのコンテンツタイプ。 */
  type: ContentType;
  tags: readonly string[];
}

// コンテンツタイプごとの型安全な `to`。動的な `$tag` セグメントは `--` で
// エスケープした tag slug を保持する。タグはタイプごとに名前空間が分離される
// ため、リンクがタイプをまたぐことはない。
const TAG_ROUTE = {
  notes: "/notes/tags/$tag",
  glossary: "/glossary/tags/$tag",
  books: "/books/tags/$tag",
} as const;

const styles = stylex.create({
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s1,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  link: {
    display: "inline-block",
    paddingInline: space.s2,
    paddingBlock: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.tagBg,
    color: { default: colors.textSecondary, ":hover": colors.link },
    fontSize: typography.fontSizeXs,
    textDecoration: { default: "none", ":hover": "underline" },
    outlineWidth: { default: 0, ":focus-visible": 2 },
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineColor: colors.focusRing,
    outlineOffset: 2,
  },
});

/**
 * タグ一覧をタイプ別タグページへのリンクとして描画する。prerender クローラが
 * タグルートを発見できるよう、コンテンツカードや詳細ヘッダーから使われる。
 */
export function TagChips({ type, tags }: TagChipsProps) {
  // タグごとの `params` オブジェクトを安定した identity に保つためメモ化する
  // (プロジェクトの react-perf lint は JSX 内で inline 生成するオブジェクト
  // リテラルを拒否する)。
  const links = useMemo(
    () => tags.map((tag) => ({ tag, params: { tag: encodeTagToSlug(tag) } })),
    [tags],
  );
  const to = TAG_ROUTE[type];
  if (links.length === 0) return null;
  return (
    <ul {...stylex.props(styles.list)} role="list" aria-label="Tags">
      {links.map(({ tag, params }) => (
        <li key={tag}>
          <Link to={to} params={params} {...stylex.props(styles.link)}>
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
