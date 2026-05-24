import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { space, typography } from "@/styles/tokens.stylex.ts";

interface DetailLayoutProps {
  children: ReactNode;
  hasMarginalia: boolean;
}

// See AppShell.tsx for why breakpoints are flat string consts in the same
// file (defineConsts cross-file refs bypass `enableMediaQueryOrder`).
const BP_DESKTOP = "@media (min-width: 1024px)";
const BP_DESKTOP_WIDE = "@media (min-width: 1280px)";

// Center the three-column track so that the float-target gutters stay aligned
// with the main column on viewports wider than the track itself.
const styles = stylex.create({
  wrapper: {
    display: "grid",
    justifyContent: "center",
    gap: space.s5,
  },
  // Single-column layout for pages with no marginalia: just a centered reading
  // column. No reserved gutter cells means narrow viewports keep their width
  // and wide viewports collapse the unused space.
  wrapperSingle: {
    gridTemplateColumns: "minmax(0, 44rem)",
    gridTemplateAreas: '"main"',
  },
  // With marginalia: reserve a 12rem gutter beside the fixed 44rem main column
  // so negative-margin floats land predictably. Right gutter at >=1024px,
  // both gutters at >=1280px.
  wrapperWithMarginalia: {
    gridTemplateColumns: {
      default: "minmax(0, 44rem)",
      [BP_DESKTOP]: "minmax(0, 44rem) 12rem",
      [BP_DESKTOP_WIDE]: "12rem minmax(0, 44rem) 12rem",
    },
    gridTemplateAreas: {
      default: '"main"',
      [BP_DESKTOP]: '"main right-margin"',
      [BP_DESKTOP_WIDE]: '"left-margin main right-margin"',
    },
  },
  // Reserved gutter cells. Marginalia content is no longer mounted here:
  // callouts and footnote asides live inside the main column's HTML and use
  // negative-margin floats to escape into these cells. The empty divs exist
  // so the grid still allocates physical space for the floats to land in.
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
    fontSize: typography.fontSizeBase,
    lineHeight: typography.lineHeightRelaxed,
  },
});

export function DetailLayout({ children, hasMarginalia }: DetailLayoutProps) {
  return (
    <div
      {...stylex.props(
        styles.wrapper,
        hasMarginalia ? styles.wrapperWithMarginalia : styles.wrapperSingle,
      )}
    >
      {hasMarginalia ? <div {...stylex.props(styles.leftMargin)} aria-hidden="true" /> : null}
      <div {...stylex.props(styles.main)}>{children}</div>
      {hasMarginalia ? <div {...stylex.props(styles.rightMargin)} aria-hidden="true" /> : null}
    </div>
  );
}
