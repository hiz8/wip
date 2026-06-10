import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { listRow } from "@/styles/listRow.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

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
  grid: {
    gridTemplateColumns: { default: "1fr", [BP_ROW_WIDE]: "12.5rem minmax(0, 1fr)" },
    gap: { default: space.s1, [BP_ROW_WIDE]: space.s4 },
  },
  dividerDashed: {
    borderTopStyle: "dashed",
  },
  termCell: {
    display: "inline",
  },
  furigana: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginInlineStart: space.s2,
  },
  hintInline: {
    marginInlineStart: space.s2,
    whiteSpace: "nowrap",
  },
  def: {
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightRelaxed,
    color: colors.textPrimary,
  },
});

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
      {...stylex.props(
        listRow.row,
        styles.grid,
        showDivider && [listRow.divider, styles.dividerDashed],
        stylex.defaultMarker(),
      )}
    >
      <span {...stylex.props(styles.termCell)}>
        <span {...stylex.props(listRow.title)}>{term}</span>
        {furigana !== null && furigana.trim() !== "" && (
          <span {...stylex.props(styles.furigana)}>{furigana}</span>
        )}
        <span {...stylex.props(listRow.openHint, styles.hintInline)} aria-hidden="true">
          詳細 →
        </span>
      </span>
      <span {...stylex.props(styles.def)}>{summary}</span>
    </Link>
  );
}
