import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { IconNav } from "./IconNav.tsx";

// Breakpoints are defined inline (not imported from a shared file) so the
// StyleX babel plugin resolves `bp.X` to literal `@media ...` strings. Under
// `unstable_moduleResolution.type: "custom"`, cross-file imports become
// `var(--hash)` theme refs, which bypass `enableMediaQueryOrder` and let
// overlapping media queries collide in source order.
const bp = {
  tablet: "@media (min-width: 768px)",
  desktop: "@media (min-width: 1024px)",
} as const;

export type AppShellVariant = "home" | "list" | "detail";

interface AppShellProps {
  variant: AppShellVariant;
  treeSidebar?: ReactNode | undefined;
  rightSidebar?: ReactNode | undefined;
  children: ReactNode;
}

const styles = stylex.create({
  root: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "auto 1fr",
    backgroundColor: colors.bgBase,
    color: colors.textPrimary,
    fontFamily: typography.fontSans,
    fontSize: typography.fontSizeBase,
    lineHeight: typography.lineHeightNormal,
  },
  body: {
    minWidth: 0,
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateAreas: '"main"',
  },
  bodyWithTree: {
    gridTemplateColumns: {
      default: "1fr",
      [bp.tablet]: "minmax(220px, 16rem) 1fr",
    },
    gridTemplateAreas: {
      default: '"main"',
      [bp.tablet]: '"tree main"',
    },
  },
  bodyWithRight: {
    gridTemplateColumns: {
      default: "1fr",
      [bp.tablet]: "minmax(220px, 16rem) 1fr",
      [bp.desktop]: "minmax(220px, 16rem) minmax(0, 1fr) minmax(220px, 18rem)",
    },
    gridTemplateAreas: {
      default: '"main"',
      [bp.tablet]: '"tree main"',
      [bp.desktop]: '"tree main right"',
    },
  },
  treeArea: {
    gridArea: "tree",
    display: { default: "none", [bp.tablet]: "block" },
    borderRight: `1px solid ${colors.borderSubtle}`,
    backgroundColor: colors.bgSurface,
    minHeight: "100vh",
  },
  mainArea: {
    gridArea: "main",
    minWidth: 0,
    paddingInline: { default: space.s4, [bp.tablet]: space.s6 },
    paddingBlock: space.s5,
  },
  rightArea: {
    gridArea: "right",
    display: { default: "none", [bp.desktop]: "block" },
    borderLeft: `1px solid ${colors.borderSubtle}`,
    backgroundColor: colors.bgSurface,
    paddingInline: space.s4,
    paddingBlock: space.s5,
    minHeight: "100vh",
  },
});

export function AppShell({ variant, treeSidebar, rightSidebar, children }: AppShellProps) {
  const showTree = variant !== "home" && treeSidebar !== undefined;
  const showRight = variant === "detail" && rightSidebar !== undefined;
  return (
    <div {...stylex.props(styles.root)}>
      <IconNav />
      <div
        {...stylex.props(
          styles.body,
          showRight ? styles.bodyWithRight : showTree ? styles.bodyWithTree : null,
        )}
      >
        {showTree ? <aside {...stylex.props(styles.treeArea)}>{treeSidebar}</aside> : null}
        <div {...stylex.props(styles.mainArea)}>{children}</div>
        {showRight ? <aside {...stylex.props(styles.rightArea)}>{rightSidebar}</aside> : null}
      </div>
    </div>
  );
}
