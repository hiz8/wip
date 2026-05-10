import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { space, typography } from "@/styles/tokens.stylex.ts";

// Breakpoints are defined inline (not imported from a shared file) so the
// StyleX babel plugin resolves `bp.X` to literal `@media ...` strings. Under
// `unstable_moduleResolution.type: "custom"`, cross-file imports become
// `var(--hash)` theme refs, which bypass `enableMediaQueryOrder` and let
// overlapping media queries collide in source order.
const bp = {
  desktopWide: "@media (min-width: 1280px)",
} as const;

interface DetailLayoutProps {
  children: ReactNode;
}

const styles = stylex.create({
  wrapper: {
    display: "grid",
    gap: space.s5,
    gridTemplateColumns: {
      default: "1fr",
      [bp.desktopWide]: "minmax(0, 12rem) minmax(0, 1fr) minmax(0, 12rem)",
    },
    gridTemplateAreas: {
      default: '"main"',
      [bp.desktopWide]: '"left-margin main right-margin"',
    },
  },
  marginColumn: {
    display: { default: "none", [bp.desktopWide]: "block" },
  },
  leftMargin: {
    gridArea: "left-margin",
  },
  rightMargin: {
    gridArea: "right-margin",
  },
  main: {
    gridArea: "main",
    minWidth: 0,
    maxWidth: "44rem",
    marginInline: "auto",
    fontSize: typography.fontSizeBase,
    lineHeight: typography.lineHeightRelaxed,
  },
});

export function DetailLayout({ children }: DetailLayoutProps) {
  return (
    <div {...stylex.props(styles.wrapper)}>
      <div {...stylex.props(styles.marginColumn, styles.leftMargin)} aria-hidden="true" />
      <div {...stylex.props(styles.main)}>{children}</div>
      <div {...stylex.props(styles.marginColumn, styles.rightMargin)} aria-hidden="true" />
    </div>
  );
}
