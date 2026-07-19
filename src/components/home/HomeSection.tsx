import type { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

interface HomeSectionProps {
  title: string;
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
});

// トップページ各セクションの共通ラッパ (見出し + 縦リズム)。
export function HomeSection({ title, children }: HomeSectionProps) {
  return (
    <section {...stylex.props(styles.section)}>
      <h2 {...stylex.props(styles.heading)}>{title}</h2>
      {children}
    </section>
  );
}
