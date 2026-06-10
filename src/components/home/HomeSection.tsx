import type { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

interface HomeSectionProps {
  title: string;
  /** 見出しの横に添える補足 (例: 「カテゴリを横断した直近 5 件」)。 */
  note?: string;
  children: ReactNode;
}

const styles = stylex.create({
  section: {
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
  },
  heading: {
    display: "flex",
    alignItems: "baseline",
    gap: space.s3,
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.weightSemibold,
    lineHeight: typography.lineHeightTight,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: colors.textMuted,
  },
  note: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightRegular,
    textTransform: "none",
    letterSpacing: "normal",
    color: colors.textMuted,
    opacity: 0.8,
  },
});

// トップページ各セクションの共通ラッパ (見出し + 縦リズム)。
export function HomeSection({ title, note, children }: HomeSectionProps) {
  return (
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>
        {title}
        {note !== undefined && <span {...stylex.props(styles.note)}>{note}</span>}
      </h2>
      {children}
    </section>
  );
}
