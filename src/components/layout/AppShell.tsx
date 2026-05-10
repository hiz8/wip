import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { IconNav } from "./IconNav.tsx";

export type AppShellVariant = "home" | "list" | "detail";

interface AppShellProps {
  variant: AppShellVariant;
  treeSidebar?: ReactNode | undefined;
  rightSidebar?: ReactNode | undefined;
  children: ReactNode;
}

// Breakpoints are kept as literal media-query strings (not pulled through a
// `const bp = { ... }` indirection) so the @stylexjs/eslint-plugin can verify
// keys statically, and so the StyleX babel plugin emits literal `@media ...`
// keys. Under `unstable_moduleResolution.type: "custom"`, cross-file imports
// become `var(--hash)` theme refs, which bypass `enableMediaQueryOrder` and
// let overlapping media queries collide in source order.
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
      "@media (min-width: 768px)": "minmax(220px, 16rem) 1fr",
    },
    gridTemplateAreas: {
      default: '"main"',
      "@media (min-width: 768px)": '"tree main"',
    },
  },
  bodyWithRight: {
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 768px)": "minmax(220px, 16rem) 1fr",
      "@media (min-width: 1024px)": "minmax(220px, 16rem) minmax(0, 1fr) minmax(220px, 18rem)",
    },
    gridTemplateAreas: {
      default: '"main"',
      "@media (min-width: 768px)": '"tree main"',
      "@media (min-width: 1024px)": '"tree main right"',
    },
  },
  treeArea: {
    gridRowStart: "tree",
    gridRowEnd: "tree",
    gridColumnStart: "tree",
    gridColumnEnd: "tree",
    display: { default: "none", "@media (min-width: 768px)": "block" },
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
    minHeight: "100vh",
  },
  mainArea: {
    gridRowStart: "main",
    gridRowEnd: "main",
    gridColumnStart: "main",
    gridColumnEnd: "main",
    minWidth: 0,
    paddingInline: { default: space.s4, "@media (min-width: 768px)": space.s6 },
    paddingBlock: space.s5,
  },
  rightArea: {
    gridRowStart: "right",
    gridRowEnd: "right",
    gridColumnStart: "right",
    gridColumnEnd: "right",
    display: { default: "none", "@media (min-width: 1024px)": "block" },
    borderInlineStartWidth: 1,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: colors.borderSubtle,
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
