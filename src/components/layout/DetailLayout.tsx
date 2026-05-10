import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { space, typography } from "@/styles/tokens.stylex.ts";

interface DetailLayoutProps {
  children: ReactNode;
}

// See AppShell.tsx for why breakpoints are flat string consts in the same
// file (defineConsts cross-file refs bypass `enableMediaQueryOrder`).
const BP_DESKTOP_WIDE = "@media (min-width: 1280px)";

const styles = stylex.create({
  wrapper: {
    display: "grid",
    gap: space.s5,
    gridTemplateColumns: {
      default: "1fr",
      [BP_DESKTOP_WIDE]: "minmax(0, 12rem) minmax(0, 1fr) minmax(0, 12rem)",
    },
    gridTemplateAreas: {
      default: '"main"',
      [BP_DESKTOP_WIDE]: '"left-margin main right-margin"',
    },
  },
  marginColumn: {
    display: { default: "none", [BP_DESKTOP_WIDE]: "block" },
  },
  leftMargin: {
    gridRowStart: "left-margin",
    gridRowEnd: "left-margin",
    gridColumnStart: "left-margin",
    gridColumnEnd: "left-margin",
  },
  rightMargin: {
    gridRowStart: "right-margin",
    gridRowEnd: "right-margin",
    gridColumnStart: "right-margin",
    gridColumnEnd: "right-margin",
  },
  main: {
    gridRowStart: "main",
    gridRowEnd: "main",
    gridColumnStart: "main",
    gridColumnEnd: "main",
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
