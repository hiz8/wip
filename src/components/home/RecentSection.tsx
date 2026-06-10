import * as stylex from "@stylexjs/stylex";
import type { HomeRecentItem } from "@/server/home.ts";
import type { ContentType } from "@/types/content.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";
import { ContentLink } from "./ContentLink.tsx";

interface RecentSectionProps {
  items: readonly HomeRecentItem[];
}

const CATEGORY_LABELS: Record<ContentType, string> = {
  notes: "Notes",
  glossary: "Glossary",
  books: "Books",
};

// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約。
// AppShell.tsx 冒頭コメント参照)。
const BP_ROW_WIDE = "@media (min-width: 721px)";

const styles = stylex.create({
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  // 行全体を 1 つのリンクにする。hover 背景を本文列の外まで広げるため、
  // 左右 padding と同量の負マージンで張り出す。
  row: {
    display: "grid",
    gridTemplateColumns: {
      default: "5rem minmax(0, 1fr) auto",
      [BP_ROW_WIDE]: "6rem minmax(0, 1fr) auto auto",
    },
    alignItems: "baseline",
    gap: space.s4,
    paddingBlock: space.s3,
    paddingInline: space.s3,
    marginInline: `calc(-1 * ${space.s3})`,
    borderRadius: radius.md,
    fontWeight: typography.weightRegular,
    textDecoration: "none",
    color: colors.textPrimary,
    backgroundColor: {
      default: "transparent",
      ":hover": colors.hoverBg,
      ":focus-visible": colors.hoverBg,
    },
    transitionProperty: "background-color",
    transitionDuration: "120ms",
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.borderSubtle,
  },
  category: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightMedium,
    letterSpacing: "0.02em",
    color: colors.accent,
  },
  title: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeBase,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    color: {
      default: colors.textPrimary,
      [stylex.when.ancestor(":hover")]: colors.link,
      [stylex.when.ancestor(":focus-visible")]: colors.link,
    },
    transitionProperty: "color",
    transitionDuration: "120ms",
  },
  openHint: {
    display: { default: "none", [BP_ROW_WIDE]: "inline" },
    fontSize: typography.fontSizeXs,
    color: colors.link,
    opacity: {
      default: 0,
      [stylex.when.ancestor(":hover")]: 1,
      [stylex.when.ancestor(":focus-visible")]: 1,
    },
    transitionProperty: "opacity",
    transitionDuration: "120ms",
  },
  date: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
});

// defaultMarker は行リンクを title/openHint の when.ancestor(":hover") の観測対象にする。
// 先頭行のみ罫線なし (reference の :first-child 相当を JS 分岐で表現)。
const ROW_STYLE = [styles.row, stylex.defaultMarker()];
const ROW_STYLE_WITH_DIVIDER = [styles.row, styles.rowDivider, stylex.defaultMarker()];

// 最近更新されたコンテンツ (Notes/Glossary/Books 横断、updated 降順)。
// 各行はカテゴリ / タイトル / 開く → (hover 時のみ) / 日付のグリッドで、行全体がリンク。
export function RecentSection({ items }: RecentSectionProps) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示
    <ul {...stylex.props(styles.list)} role="list">
      {items.map((item, index) => (
        <li key={`${item.type}:${item.slug}`}>
          <ContentLink
            type={item.type}
            slug={item.slug}
            style={index > 0 ? ROW_STYLE_WITH_DIVIDER : ROW_STYLE}
          >
            <span {...stylex.props(styles.category)}>{CATEGORY_LABELS[item.type]}</span>
            <span {...stylex.props(styles.title)}>{item.title}</span>
            <span {...stylex.props(styles.openHint)} aria-hidden="true">
              開く →
            </span>
            <time dateTime={item.updated} {...stylex.props(styles.date)}>
              {item.updated.slice(0, 10)}
            </time>
          </ContentLink>
        </li>
      ))}
    </ul>
  );
}
