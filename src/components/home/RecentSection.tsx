import * as stylex from "@stylexjs/stylex";
import type { HomeRecentItem } from "@/server/home.ts";
import { CONTENT_TYPE_LABELS } from "@/components/common/contentTypeLabels.ts";
import { listRow } from "@/styles/listRow.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { ContentLink } from "./ContentLink.tsx";

interface RecentSectionProps {
  items: readonly HomeRecentItem[];
}

// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約。
// AppShell.tsx 冒頭コメント参照)。
const BP_ROW_WIDE = "@media (min-width: 721px)";

const styles = stylex.create({
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  grid: {
    gridTemplateColumns: {
      default: "5rem minmax(0, 1fr) auto",
      [BP_ROW_WIDE]: "6rem minmax(0, 1fr) auto auto",
    },
    gap: space.s4,
  },
  category: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightMedium,
    letterSpacing: "0.02em",
    color: colors.accent,
  },
  hintWide: {
    display: { default: "none", [BP_ROW_WIDE]: "inline" },
  },
});

// ContentLink へ style として渡すため配列 const に固定する (prop identity 安定化)。
// defaultMarker は行リンクを title/openHint の when.ancestor(":hover") の観測対象にする。
// 先頭行のみ罫線なし (reference の :first-child 相当を JS 分岐で表現)。
const ROW_STYLE = [listRow.row, styles.grid, stylex.defaultMarker()];
const ROW_STYLE_WITH_DIVIDER = [listRow.row, styles.grid, listRow.divider, stylex.defaultMarker()];

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
            {...(item.blogLink === undefined ? {} : { blogLink: item.blogLink })}
            style={index > 0 ? ROW_STYLE_WITH_DIVIDER : ROW_STYLE}
          >
            <span {...stylex.props(styles.category)}>{CONTENT_TYPE_LABELS[item.type]}</span>
            <span {...stylex.props(listRow.title, listRow.titleHoverLink)}>{item.title}</span>
            <span
              {...stylex.props(listRow.openHint, listRow.openHintLink, styles.hintWide)}
              aria-hidden="true"
            >
              開く →
            </span>
            <time dateTime={item.updated} {...stylex.props(listRow.date)}>
              {item.updated.slice(0, 10)}
            </time>
          </ContentLink>
        </li>
      ))}
    </ul>
  );
}
