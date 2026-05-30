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

// ブレイクポイントは (`.stylex.ts` ファイルの `defineConsts` ではなく) 同一
// ファイル内のフラットな文字列 const として置く。ファイルをまたぐ media-query
// const は `unstable_moduleResolution.type: "custom"` の下では `var(--hash)`
// 参照として出力され、`enableMediaQueryOrder` をバイパスして重なり合うクエリを
// ソース順で衝突させてしまう。同一ファイルの文字列 const は StyleX babel plugin
// によって静的に inline 化され、`@stylexjs/eslint-plugin` の identifier
// evaluator で解決される (これは `MemberExpression` をたどらないため、以前の
// `as const bp = { ... }` オブジェクトパターンは使えない)。
const BP_TABLET = "@media (min-width: 768px)";
const BP_DESKTOP = "@media (min-width: 1024px)";

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
      [BP_TABLET]: "minmax(220px, 16rem) 1fr",
    },
    gridTemplateAreas: {
      default: '"main"',
      [BP_TABLET]: '"tree main"',
    },
  },
  bodyWithRight: {
    gridTemplateColumns: {
      default: "1fr",
      [BP_TABLET]: "minmax(220px, 16rem) 1fr",
      [BP_DESKTOP]: "minmax(220px, 16rem) minmax(0, 1fr) minmax(220px, 18rem)",
    },
    gridTemplateAreas: {
      default: '"main"',
      [BP_TABLET]: '"tree main"',
      [BP_DESKTOP]: '"tree main right"',
    },
  },
  treeArea: {
    gridRowStart: "tree",
    gridRowEnd: "tree",
    gridColumnStart: "tree",
    gridColumnEnd: "tree",
    display: { default: "none", [BP_TABLET]: "block" },
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
    paddingInline: { default: space.s4, [BP_TABLET]: space.s6 },
    paddingBlock: space.s5,
  },
  rightArea: {
    gridRowStart: "right",
    gridRowEnd: "right",
    gridColumnStart: "right",
    gridColumnEnd: "right",
    display: { default: "none", [BP_DESKTOP]: "block" },
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
