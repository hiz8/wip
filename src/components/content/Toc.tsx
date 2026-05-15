import * as stylex from "@stylexjs/stylex";
import type { TocEntry } from "@/types/content.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { useTocActive } from "./useTocActive.ts";

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
  linkActive: {
    color: colors.accent,
    fontWeight: typography.weightSemibold,
  },
});

export function Toc({ entries }: TocProps) {
  const activeId = useTocActive(entries.map((entry) => entry.id));

  if (entries.length === 0) return null;
  return (
    <nav {...stylex.props(styles.nav)} aria-label="Table of contents">
      <p {...stylex.props(styles.heading)}>On this page</p>
      <ol {...stylex.props(styles.list)}>
        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          return (
            <li key={entry.id} {...stylex.props(entry.depth === 3 && styles.itemH3)}>
              <a
                href={`#${entry.id}`}
                aria-current={isActive ? "location" : undefined}
                {...stylex.props(styles.link, isActive && styles.linkActive)}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
