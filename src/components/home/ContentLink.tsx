import { useMemo, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import type { StyleXStyles } from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { ContentType } from "@/types/content.ts";
import { colors, typography } from "@/styles/tokens.stylex.ts";

interface ContentLinkProps {
  type: ContentType;
  slug: string;
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

// type に応じて適切な詳細ルートへリンクする。router params は型安全に保つため
// (href 文字列を作らず) ここで出し分ける。Backlinks.tsx と同じ方針。
export function ContentLink({ type, slug, style, children }: ContentLinkProps) {
  const linkProps = stylex.props(style ?? styles.link);
  // notes/glossary は { slug }、books は { isbn } を要求する。両キーを持つ 1 つの
  // オブジェクトはどちらの params 型とも構造的に互換なので、memo は 1 回で足りる
  // (react-perf の object-as-prop ルールを満たしつつ毎 render の二重生成を避ける)。
  const params = useMemo(() => ({ slug, isbn: slug }), [slug]);
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
