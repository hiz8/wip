import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { space, typography } from "@/styles/tokens.stylex.ts";

interface DetailLayoutProps {
  children: ReactNode;
  leftMargin?: ReactNode;
  rightMargin?: ReactNode;
}

// See AppShell.tsx for why breakpoints are flat string consts in the same
// file (defineConsts cross-file refs bypass `enableMediaQueryOrder`).
const BP_DESKTOP = "@media (min-width: 1024px)";
const BP_DESKTOP_WIDE = "@media (min-width: 1280px)";

const styles = stylex.create({
  wrapper: {
    display: "grid",
    gap: space.s5,
    gridTemplateColumns: {
      default: "1fr",
      [BP_DESKTOP]: "minmax(0, 1fr) minmax(0, 12rem)",
      [BP_DESKTOP_WIDE]: "minmax(0, 12rem) minmax(0, 1fr) minmax(0, 12rem)",
    },
    gridTemplateAreas: {
      default: '"main"',
      [BP_DESKTOP]: '"main right-margin"',
      [BP_DESKTOP_WIDE]: '"left-margin main right-margin"',
    },
  },
  leftMargin: {
    gridRowStart: "left-margin",
    gridRowEnd: "left-margin",
    gridColumnStart: "left-margin",
    gridColumnEnd: "left-margin",
    display: { default: "none", [BP_DESKTOP_WIDE]: "block" },
  },
  rightMargin: {
    gridRowStart: "right-margin",
    gridRowEnd: "right-margin",
    gridColumnStart: "right-margin",
    gridColumnEnd: "right-margin",
    display: { default: "none", [BP_DESKTOP]: "block" },
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

export function DetailLayout({ children, leftMargin, rightMargin }: DetailLayoutProps) {
  return (
    <div {...stylex.props(styles.wrapper)}>
      <div {...stylex.props(styles.leftMargin)} aria-hidden={leftMargin ? undefined : true}>
        {leftMargin}
      </div>
      <div {...stylex.props(styles.main)}>{children}</div>
      <div {...stylex.props(styles.rightMargin)} aria-hidden={rightMargin ? undefined : true}>
        {rightMargin}
      </div>
    </div>
  );
}
