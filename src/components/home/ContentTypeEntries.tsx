import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import type { ContentType } from "@/types/content.ts";
import type { HomeCounts } from "@/server/home.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface ContentTypeEntriesProps {
  counts: HomeCounts;
}

const ENTRIES: ReadonlyArray<{
  type: ContentType;
  to: "/notes" | "/glossary" | "/books";
  label: string;
}> = [
  { type: "notes", to: "/notes", label: "Notes" },
  { type: "glossary", to: "/glossary", label: "Glossary" },
  { type: "books", to: "/books", label: "Books" },
];

const styles = stylex.create({
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: space.s4,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: space.s3,
    padding: space.s4,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.borderSubtle, ":hover": colors.borderStrong },
    borderRadius: radius.md,
    color: colors.textPrimary,
    textDecoration: "none",
    transitionProperty: "border-color",
    transitionDuration: "120ms",
  },
  icon: {
    flexShrink: 0,
    color: colors.accent,
    lineHeight: 0,
  },
  text: {
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
  },
  label: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.weightSemibold,
    lineHeight: typography.lineHeightTight,
  },
  count: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },
});

// コンテンツタイプ別の入り口 (各タイプへの導線 + 公開件数)。
export function ContentTypeEntries({ counts }: ContentTypeEntriesProps) {
  return (
    <ul {...stylex.props(styles.list)} role="list">
      {ENTRIES.map((entry) => (
        <li key={entry.type}>
          <Link to={entry.to} {...stylex.props(styles.card)}>
            <span {...stylex.props(styles.icon)} aria-hidden="true">
              <ContentTypeIcon type={entry.type} size={28} />
            </span>
            <span {...stylex.props(styles.text)}>
              <span {...stylex.props(styles.label)}>{entry.label}</span>
              <span {...stylex.props(styles.count)}>{counts[entry.type]} 件</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
