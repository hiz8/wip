import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { TagChips } from "@/components/common/TagChips.tsx";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface NoteCardProps {
  slug: string;
  title: string;
  summary: string | null;
  tags: readonly string[];
  updated: string;
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
    transitionProperty: "border-color, transform",
    transitionDuration: "120ms",
  },
  title: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.link,
    lineHeight: typography.lineHeightTight,
    textDecoration: { default: "none", ":hover": "underline" },
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
});

export function NoteCard({ slug, title, summary, tags, updated }: NoteCardProps) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <article {...stylex.props(styles.card)}>
      <Link to="/notes/$slug" params={params} {...stylex.props(styles.title)}>
        {title}
      </Link>
      {summary !== null && summary.trim() !== "" && (
        <p {...stylex.props(styles.summary)}>{summary}</p>
      )}
      <div {...stylex.props(styles.meta)}>
        <time dateTime={updated}>{updated.slice(0, 10)}</time>
        <TagChips type="notes" tags={tags} />
      </div>
    </article>
  );
}
