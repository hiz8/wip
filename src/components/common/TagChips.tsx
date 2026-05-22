import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { encodeTagToSlug } from "@/lib/tags/index.ts";
import type { ContentType } from "@/types/content.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface TagChipsProps {
  /** Content type whose namespaced tag pages the chips link to. */
  type: ContentType;
  tags: readonly string[];
}

// Type-safe `to` per content type; the dynamic `$tag` segment carries the
// `--`-escaped tag slug. Tags are namespaced per type so links never cross types.
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
    backgroundColor: colors.bgElevated,
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
 * Render a list of tags as links to the per-type tag pages. Used by the content
 * cards and the detail header so the prerender crawler discovers tag routes.
 */
export function TagChips({ type, tags }: TagChipsProps) {
  // Memoize per-tag `params` objects so they keep a stable identity (the
  // project's react-perf lint rejects object literals created inline in JSX).
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
