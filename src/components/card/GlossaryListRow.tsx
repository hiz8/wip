import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface GlossaryListRowProps {
  slug: string;
  term: string;
  furigana: string | null;
  summary: string | null;
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
    gridTemplateColumns: { default: "1fr", [BP_ROW_WIDE]: "12.5rem minmax(0, 1fr)" },
    alignItems: "baseline",
    gap: { default: space.s1, [BP_ROW_WIDE]: space.s4 },
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
    borderTopStyle: "dashed",
    borderTopColor: colors.borderSubtle,
  },
  termCell: {
    display: "inline",
  },
  term: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeBase,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    color: colors.textPrimary,
  },
  furigana: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginInlineStart: space.s2,
  },
  openHint: {
    fontSize: typography.fontSizeXs,
    color: colors.accent,
    marginInlineStart: space.s2,
    whiteSpace: "nowrap",
    opacity: {
      default: 0,
      [stylex.when.ancestor(":hover")]: 1,
      [stylex.when.ancestor(":focus-visible")]: 1,
    },
    transitionProperty: "opacity",
    transitionDuration: "120ms",
  },
  def: {
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightRelaxed,
    color: colors.textPrimary,
  },
});

// defaultMarker は行リンクを openHint の when.ancestor(":hover") の観測対象にする。
const ROW_STYLE = [styles.row, stylex.defaultMarker()];
const ROW_STYLE_WITH_DIVIDER = [styles.row, styles.rowDivider, stylex.defaultMarker()];

// Glossary 索引の 1 行 (用語 + ふりがな + 詳細 → (hover 時のみ) | 定義文)。行全体がリンク。
export function GlossaryListRow({
  slug,
  term,
  furigana,
  summary,
  showDivider,
}: GlossaryListRowProps) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <Link
      to="/glossary/$slug"
      params={params}
      {...stylex.props(showDivider ? ROW_STYLE_WITH_DIVIDER : ROW_STYLE)}
    >
      <span {...stylex.props(styles.termCell)}>
        <span {...stylex.props(styles.term)}>{term}</span>
        {furigana !== null && furigana.trim() !== "" && (
          <span {...stylex.props(styles.furigana)}>{furigana}</span>
        )}
        <span {...stylex.props(styles.openHint)} aria-hidden="true">
          詳細 →
        </span>
      </span>
      <span {...stylex.props(styles.def)}>{summary}</span>
    </Link>
  );
}
