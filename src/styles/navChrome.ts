import * as stylex from "@stylexjs/stylex";
import { colors, radius } from "@/styles/tokens.stylex.ts";

// 深ブルーのナビレール / モバイルバーに同居するアイコンボタン。可読化のため nav 系
// トークンで配色する。IconNav / MobileTopBar / ThemeToggle で共有する。
export const navChrome = stylex.create({
  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "44px",
    height: "44px",
    borderRadius: radius.lg,
    color: { default: colors.navIcon, ":hover": colors.navIconActive },
    backgroundColor: { default: "transparent", ":hover": colors.navItemHoverBg },
    transitionProperty: "color, background-color",
    transitionDuration: "120ms",
  },
  iconButtonActive: {
    color: colors.navIconActive,
    backgroundColor: colors.navItemActiveBg,
  },
});
