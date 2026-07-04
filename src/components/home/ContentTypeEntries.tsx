import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import { CONTENT_TYPE_LABELS } from "@/components/common/contentTypeLabels.ts";
import type { ContentType } from "@/types/content.ts";
import type { HomeCounts } from "@/server/home.ts";
import { colors, radius, shadow, space, typography } from "@/styles/tokens.stylex.ts";

interface ContentTypeEntriesProps {
  counts: HomeCounts;
}

const ENTRIES: ReadonlyArray<{
  type: ContentType;
  to: "/notes" | "/glossary" | "/books" | "/blog";
  jp: string;
  desc: string;
}> = [
  {
    type: "notes",
    to: "/notes",
    jp: "ノート",
    desc: "学びを書き留めた育成中のノート。",
  },
  {
    type: "glossary",
    to: "/glossary",
    jp: "単語帳",
    desc: "毎回ググる用語を自分の言葉で定義。",
  },
  {
    type: "books",
    to: "/books",
    jp: "読書",
    desc: "手を動かしながら読んだ本だけ。",
  },
  {
    type: "blog",
    to: "/blog",
    jp: "ブログ",
    desc: "タグを軸に回遊できる短めの記事。",
  },
];

// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約。
// AppShell.tsx 冒頭コメント参照)。
const BP_CATS_WIDE = "@media (min-width: 721px)";

const styles = stylex.create({
  list: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [BP_CATS_WIDE]: "repeat(2, 1fr)" },
    gap: space.s3,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "2.5rem minmax(0, 1fr) auto",
    alignItems: "center",
    gap: space.s4,
    padding: space.s4,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.borderSubtle, ":hover": colors.accent },
    borderRadius: radius.lg,
    color: colors.textPrimary,
    textDecoration: "none",
    transform: { default: "translateY(0)", ":hover": "translateY(-2px)" },
    boxShadow: { default: "none", ":hover": shadow.lg },
    transitionProperty: "border-color, transform, box-shadow",
    transitionDuration: "140ms",
  },
  iconTile: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    display: "grid",
    placeItems: "center",
    color: colors.accent,
    lineHeight: 0,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
    minWidth: 0,
  },
  name: {
    display: "flex",
    alignItems: "baseline",
    gap: space.s2,
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeMd,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    color: colors.textPrimary,
  },
  jp: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightRegular,
    color: colors.textMuted,
  },
  desc: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
  },
  count: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.weightMedium,
    fontVariantNumeric: "tabular-nums",
    color: {
      default: colors.textMuted,
      [stylex.when.ancestor(":hover")]: colors.accent,
    },
    transitionProperty: "color",
    transitionDuration: "140ms",
  },
});

// コンテンツタイプ別の入り口カード (アイコン + 名前/和名 + 説明 + 公開件数)。
export function ContentTypeEntries({ counts }: ContentTypeEntriesProps) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示
    <ul {...stylex.props(styles.list)} role="list">
      {ENTRIES.map((entry) => (
        <li key={entry.type}>
          <Link to={entry.to} {...stylex.props(styles.card, stylex.defaultMarker())}>
            <span {...stylex.props(styles.iconTile)} aria-hidden="true">
              <ContentTypeIcon type={entry.type} size={22} />
            </span>
            <span {...stylex.props(styles.body)}>
              <span {...stylex.props(styles.name)}>
                {CONTENT_TYPE_LABELS[entry.type]}
                <span {...stylex.props(styles.jp)}>{entry.jp}</span>
              </span>
              <span {...stylex.props(styles.desc)}>{entry.desc}</span>
            </span>
            <span {...stylex.props(styles.count)}>{counts[entry.type]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
