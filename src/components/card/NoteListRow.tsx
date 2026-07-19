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
  // folder を持たない行 (原則フラットな Notes の通常ケース) 用。先頭の folder 列を
  // 持たず、タイトルを左端から始めて不要な空白を出さない。
  gridFlat: {
    gridTemplateColumns: {
      default: "minmax(0, 1fr) auto",
      [BP_ROW_WIDE]: "minmax(0, 1fr) auto auto",
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

// Notes 一覧の 1 行 (フォルダ (あれば) / タイトル / 開く → (hover 時のみ) / 日付)。
// 行全体がリンク。folder は原則フラットな Notes では通常 null で、その場合は
// 先頭の folder 列を省いて左端の空白を出さない。
export function NoteListRow({ slug, title, folder, updated, showDivider }: NoteListRowProps) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <Link
      to="/notes/$slug"
      params={params}
      {...stylex.props(
        listRow.row,
        folder ? styles.grid : styles.gridFlat,
        showDivider && listRow.divider,
        stylex.defaultMarker(),
      )}
    >
      {folder ? <span {...stylex.props(styles.folder)}>{folder}</span> : null}
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
