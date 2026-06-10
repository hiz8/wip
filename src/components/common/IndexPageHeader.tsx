import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { Breadcrumb } from "./Breadcrumb.tsx";

interface IndexPageHeaderProps {
  /** パンくずの先頭 (コンテンツタイプ名)。 */
  crumbRoot: string;
  /** パンくずの現在地 (例: 「最近の更新」「索引」)。 */
  crumbCurrent: string;
  title: string;
  sub: string;
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
    fontSize: typography.fontSizeMd,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
    maxWidth: "32em",
    marginBottom: space.s4,
  },
});

// 一覧ページ共通のヘッダ (パンくず + 大見出し + イタリックの説明文)。
export function IndexPageHeader({ crumbRoot, crumbCurrent, title, sub }: IndexPageHeaderProps) {
  const root = useMemo(() => ({ label: crumbRoot }), [crumbRoot]);
  return (
    <>
      <Breadcrumb root={root} current={crumbCurrent} />
      <h1 {...stylex.props(styles.heading)}>{title}</h1>
      <p {...stylex.props(styles.sub)}>{sub}</p>
    </>
  );
}
