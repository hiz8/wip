import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface NoteListRowProps {
  slug: string;
  title: string;
  folder: string | null;
  updated: string;
  /** 先頭行のみ false (行間罫線を引かない)。 */
  showDivider: boolean;
}

// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約。
// AppShell.tsx 冒頭コメント参照)。
const BP_ROW_WIDE = "@media (min-width: 721px)";

const styles = stylex.create({
  // 行全体を 1 つのリンクにする。hover 背景を本文列の外まで広げるため、
  // 左右 padding と同量の負マージンで張り出す。
  row: {
    display: "grid",
    gridTemplateColumns: {
      default: "6rem minmax(0, 1fr) auto",
      [BP_ROW_WIDE]: "7.5rem minmax(0, 1fr) auto auto",
    },
    alignItems: "baseline",
    gap: space.s4,
    paddingBlock: space.s3,
    paddingInline: space.s3,
    marginInline: `calc(-1 * ${space.s3})`,
    borderRadius: radius.md,
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
  folder: {
    fontSize: typography.fontSizeXs,
    letterSpacing: "0.02em",
    color: colors.textMuted,
  },
  title: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeBase,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    color: {
      default: colors.textPrimary,
      [stylex.when.ancestor(":hover")]: colors.accent,
      [stylex.when.ancestor(":focus-visible")]: colors.accent,
    },
    transitionProperty: "color",
    transitionDuration: "120ms",
  },
  openHint: {
    display: { default: "none", [BP_ROW_WIDE]: "inline" },
    fontSize: typography.fontSizeXs,
    color: colors.accent,
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
const ROW_STYLE = [styles.row, stylex.defaultMarker()];
const ROW_STYLE_WITH_DIVIDER = [styles.row, styles.rowDivider, stylex.defaultMarker()];

// Notes 一覧の 1 行 (フォルダ / タイトル / 開く → (hover 時のみ) / 日付)。行全体がリンク。
export function NoteListRow({ slug, title, folder, updated, showDivider }: NoteListRowProps) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <Link
      to="/notes/$slug"
      params={params}
      {...stylex.props(showDivider ? ROW_STYLE_WITH_DIVIDER : ROW_STYLE)}
    >
      <span {...stylex.props(styles.folder)}>{folder}</span>
      <span {...stylex.props(styles.title)}>{title}</span>
      <span {...stylex.props(styles.openHint)} aria-hidden="true">
        開く →
      </span>
      <time dateTime={updated} {...stylex.props(styles.date)}>
        {updated.slice(0, 10)}
      </time>
    </Link>
  );
}
