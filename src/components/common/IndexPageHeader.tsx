import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { Breadcrumb } from "./Breadcrumb.tsx";

interface IndexPageHeaderProps {
  /** パンくずの先頭 (コンテンツタイプ名)。 */
  crumbRoot: string;
  /** パンくずの現在地 (例: 「最近の更新」「索引」)。 */
  crumbCurrent: string;
  title: string;
  sub: string;
  /** 指定するとタグ一覧への "Browse tags →" リンクを説明文の下に表示する。 */
  tagsTo?: "/notes/tags" | "/glossary/tags" | "/books/tags";
}

const styles = stylex.create({
  heading: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    letterSpacing: "-0.01em",
    marginBottom: space.s3,
  },
  sub: {
    fontFamily: typography.fontBrand,
    fontStyle: "italic",
    fontSize: typography.fontSizeSm,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
    marginBottom: space.s4,
  },
  tagsLink: {
    display: "inline-block",
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s4,
  },
});

// 一覧ページ共通のヘッダ (パンくず + 大見出し + イタリックの説明文 + タグ一覧リンク)。
export function IndexPageHeader({
  crumbRoot,
  crumbCurrent,
  title,
  sub,
  tagsTo,
}: IndexPageHeaderProps) {
  return (
    <>
      <Breadcrumb rootLabel={crumbRoot} current={crumbCurrent} />
      <h1 {...stylex.props(styles.heading)}>{title}</h1>
      <p {...stylex.props(styles.sub)}>{sub}</p>
      {tagsTo !== undefined && (
        <Link to={tagsTo} {...stylex.props(styles.tagsLink)}>
          Browse tags →
        </Link>
      )}
    </>
  );
}
