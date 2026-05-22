import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { encodeTagToSlug } from "@/lib/tags/index.ts";
import type { TagCount } from "@/lib/tags/index.ts";
import type { ContentType } from "@/types/content.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface TagIndexListProps {
  /** Content type whose namespaced tag pages the links point to. */
  type: ContentType;
  tags: readonly TagCount[];
}

const TAG_ROUTE = {
  notes: "/notes/tags/$tag",
  glossary: "/glossary/tags/$tag",
  books: "/books/tags/$tag",
} as const;

const styles = stylex.create({
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s2,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  link: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: space.s1,
    paddingInline: space.s3,
    paddingBlock: space.s1,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    color: { default: colors.textSecondary, ":hover": colors.link },
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    outlineWidth: { default: 0, ":focus-visible": 2 },
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineColor: colors.focusRing,
    outlineOffset: 2,
  },
  count: {
    color: colors.textMuted,
    fontSize: typography.fontSizeXs,
  },
});

/** List of tags with usage counts, each linking to its per-type tag page. */
export function TagIndexList({ type, tags }: TagIndexListProps) {
  // Memoize per-tag `params` objects for stable identity (react-perf lint).
  const links = useMemo(
    () => tags.map(({ tag, count }) => ({ tag, count, params: { tag: encodeTagToSlug(tag) } })),
    [tags],
  );
  const to = TAG_ROUTE[type];
  return (
    <ul {...stylex.props(styles.list)} role="list">
      {links.map(({ tag, count, params }) => (
        <li key={tag}>
          <Link to={to} params={params} {...stylex.props(styles.link)}>
            <span>{tag}</span>
            <span {...stylex.props(styles.count)}>{count}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
