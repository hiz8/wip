import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { TagChips } from "@/components/common/TagChips.tsx";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface GlossaryItemProps {
  slug: string;
  term: string;
  furigana: string | null;
  summary: string | null;
  aliases: readonly string[];
  tags: readonly string[];
}

const styles = stylex.create({
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
    paddingBlock: space.s4,
    paddingInline: space.s4,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.borderSubtle, ":hover": colors.borderStrong },
    borderRadius: radius.md,
    transitionProperty: "border-color",
    transitionDuration: "120ms",
  },
  termRow: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: space.s2,
  },
  term: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.weightSemibold,
    color: colors.link,
    textDecoration: { default: "none", ":hover": "underline" },
    lineHeight: typography.lineHeightTight,
  },
  furigana: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
    marginTop: space.s1,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.s2,
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginTop: space.s2,
  },
  pillList: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s1,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  pill: {
    display: "inline-block",
    paddingInline: space.s2,
    paddingBlock: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    color: colors.textSecondary,
  },
});

export function GlossaryItem({ slug, term, furigana, summary, aliases, tags }: GlossaryItemProps) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <article {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.termRow)}>
        <Link to="/glossary/$slug" params={params} {...stylex.props(styles.term)}>
          {term}
        </Link>
        {furigana !== null && furigana.trim() !== "" && (
          <span {...stylex.props(styles.furigana)}>{furigana}</span>
        )}
      </div>
      {summary !== null && summary.trim() !== "" && (
        <p {...stylex.props(styles.summary)}>{summary}</p>
      )}
      {(aliases.length > 0 || tags.length > 0) && (
        <div {...stylex.props(styles.meta)}>
          {aliases.length > 0 && (
            // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示
            <ul {...stylex.props(styles.pillList)} role="list" aria-label="Aliases">
              {aliases.map((alias) => (
                <li key={`alias-${alias}`} {...stylex.props(styles.pill)}>
                  {alias}
                </li>
              ))}
            </ul>
          )}
          <TagChips type="glossary" tags={tags} />
        </div>
      )}
    </article>
  );
}
