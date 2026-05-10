import * as stylex from "@stylexjs/stylex";
import type { TocEntry } from "@/types/content.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

interface TocProps {
  entries: readonly TocEntry[];
}

const styles = stylex.create({
  nav: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightSemibold,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: colors.textMuted,
    marginBottom: space.s2,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
  },
  itemH3: {
    paddingInlineStart: space.s4,
  },
  link: {
    color: colors.textSecondary,
    textDecoration: { default: "none", ":hover": "underline" },
    lineHeight: typography.lineHeightTight,
  },
});

export function Toc({ entries }: TocProps) {
  if (entries.length === 0) return null;
  return (
    <nav {...stylex.props(styles.nav)} aria-label="Table of contents">
      <p {...stylex.props(styles.heading)}>On this page</p>
      <ol {...stylex.props(styles.list)}>
        {entries.map((entry) => (
          <li key={entry.id} {...stylex.props(entry.depth === 3 && styles.itemH3)}>
            <a href={`#${entry.id}`} {...stylex.props(styles.link)}>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
