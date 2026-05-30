import { useMemo, type ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { ContentType } from "@/types/content.ts";
import { colors, typography } from "@/styles/tokens.stylex.ts";

interface ContentLinkProps {
  type: ContentType;
  slug: string;
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
export function ContentLink({ type, slug, children }: ContentLinkProps) {
  const slugParams = useMemo(() => ({ slug }), [slug]);
  const isbnParams = useMemo(() => ({ isbn: slug }), [slug]);
  if (type === "notes") {
    return (
      <Link to="/notes/$slug" params={slugParams} {...stylex.props(styles.link)}>
        {children}
      </Link>
    );
  }
  if (type === "glossary") {
    return (
      <Link to="/glossary/$slug" params={slugParams} {...stylex.props(styles.link)}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/books/$isbn" params={isbnParams} {...stylex.props(styles.link)}>
      {children}
    </Link>
  );
}
