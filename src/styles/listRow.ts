import * as stylex from "@stylexjs/stylex";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

// 一覧の「行全体リンク」パターン。Notes 一覧 (NoteListRow) / Glossary 索引
// (GlossaryListRow) / Home 最近の更新 (RecentSection) で共有する。
// グリッド列構成 (media query を含む) は呼び出し側ファイルで定義して合成する
// (StyleX media-query order の制約。AppShell.tsx 冒頭コメント参照)。
// when.ancestor(":hover") を使う項目は、行リンク側に stylex.defaultMarker() を
// 合成して観測対象にすること。
export const listRow = stylex.create({
  // 行全体を 1 つのリンクにする。hover 背景を本文列の外まで広げるため、
  // 左右 padding と同量の負マージンで張り出す。
  row: {
    display: "grid",
    alignItems: "baseline",
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
  // 行間罫線。先頭行を除く各行の上辺に引く。
  divider: {
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.borderSubtle,
  },
  title: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeMd,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    color: colors.textPrimary,
  },
  // 行 hover でタイトルを着色する variant。title に後勝ちで合成する。
  titleHoverAccent: {
    color: {
      default: colors.textPrimary,
      [stylex.when.ancestor(":hover")]: colors.accent,
      [stylex.when.ancestor(":focus-visible")]: colors.accent,
    },
    transitionProperty: "color",
    transitionDuration: "120ms",
  },
  titleHoverLink: {
    color: {
      default: colors.textPrimary,
      [stylex.when.ancestor(":hover")]: colors.link,
      [stylex.when.ancestor(":focus-visible")]: colors.link,
    },
    transitionProperty: "color",
    transitionDuration: "120ms",
  },
  // 「開く →」などの行 hover 時のみ現れるヒント。
  openHint: {
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
  openHintLink: {
    color: colors.link,
  },
  date: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  },
});
