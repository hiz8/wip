import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { listRow } from "@/styles/listRow.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

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
  grid: {
    gridTemplateColumns: {
      default: "6rem minmax(0, 1fr) auto",
      [BP_ROW_WIDE]: "7.5rem minmax(0, 1fr) auto auto",
    },
    gap: space.s4,
  },
  folder: {
    fontSize: typography.fontSizeXs,
    letterSpacing: "0.02em",
    color: colors.textMuted,
  },
  hintWide: {
    display: { default: "none", [BP_ROW_WIDE]: "inline" },
  },
});

// Notes 一覧の 1 行 (フォルダ / タイトル / 開く → (hover 時のみ) / 日付)。行全体がリンク。
export function NoteListRow({ slug, title, folder, updated, showDivider }: NoteListRowProps) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <Link
      to="/notes/$slug"
      params={params}
      {...stylex.props(
        listRow.row,
        styles.grid,
        showDivider && listRow.divider,
        stylex.defaultMarker(),
      )}
    >
      <span {...stylex.props(styles.folder)}>{folder}</span>
      <span {...stylex.props(listRow.title, listRow.titleHoverAccent)}>{title}</span>
      <span {...stylex.props(listRow.openHint, styles.hintWide)} aria-hidden="true">
        開く →
      </span>
      <time dateTime={updated} {...stylex.props(listRow.date)}>
        {updated.slice(0, 10)}
      </time>
    </Link>
  );
}
