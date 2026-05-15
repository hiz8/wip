import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface BookCardProps {
  slug: string;
  title: string;
  authors: readonly string[];
  pubYear: number | null;
  summary: string | null;
  tags: readonly string[];
  coverUrl: string | null;
}

const styles = stylex.create({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
    padding: space.s4,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.borderSubtle, ":hover": colors.borderStrong },
    borderRadius: radius.md,
    transitionProperty: "border-color",
    transitionDuration: "120ms",
  },
  coverPlaceholder: {
    aspectRatio: "3 / 4",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
    fontSize: typography.fontSizeXs,
    textAlign: "center",
    paddingInline: space.s2,
    paddingBlock: space.s2,
    overflow: "hidden",
  },
  coverImage: {
    aspectRatio: "3 / 4",
    width: "100%",
    height: "auto",
    objectFit: "cover",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    display: "block",
  },
  title: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.link,
    lineHeight: typography.lineHeightTight,
    textDecoration: { default: "none", ":hover": "underline" },
  },
  authors: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.s2,
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s1,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  tag: {
    display: "inline-block",
    paddingInline: space.s2,
    paddingBlock: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    color: colors.textSecondary,
  },
});

export function BookCard({
  slug,
  title,
  authors,
  pubYear,
  summary,
  tags,
  coverUrl,
}: BookCardProps) {
  const params = useMemo(() => ({ isbn: slug }), [slug]);
  return (
    <article {...stylex.props(styles.card)}>
      {coverUrl === null ? (
        <div {...stylex.props(styles.coverPlaceholder)} aria-hidden="true">
          {title}
        </div>
      ) : (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          decoding="async"
          {...stylex.props(styles.coverImage)}
        />
      )}
      <Link to="/books/$isbn" params={params} {...stylex.props(styles.title)}>
        {title}
      </Link>
      {authors.length > 0 && <p {...stylex.props(styles.authors)}>{authors.join(", ")}</p>}
      {summary !== null && summary.trim() !== "" && (
        <p {...stylex.props(styles.summary)}>{summary}</p>
      )}
      <div {...stylex.props(styles.meta)}>
        {pubYear !== null && <span>{pubYear}</span>}
        {tags.length > 0 && (
          <ul {...stylex.props(styles.tags)} role="list">
            {tags.map((tag) => (
              <li key={tag} {...stylex.props(styles.tag)}>
                {tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
