import * as stylex from "@stylexjs/stylex";
import { Link, useMatches } from "@tanstack/react-router";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";
import { Icon } from "@/components/common/Icon.tsx";
import { NAV_SECTIONS } from "./navSections.tsx";

// モバイル (< 768px) 限定。≥ 768 では非表示にしデスクトップの IconNav に戻す。
// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約)。
const BP_TABLET = "@media (min-width: 768px)";

// 高さは AppShell の body 下パディング (`calc(3.5rem + env(...))`) と同期させること。
const styles = stylex.create({
  nav: {
    position: "fixed",
    insetInlineStart: 0,
    insetInlineEnd: 0,
    bottom: 0,
    display: { default: "flex", [BP_TABLET]: "none" },
    alignItems: "stretch",
    // content-box にして height + safe-area パディングを加算で確保する
    // (グローバル reset の border-box を上書き)。
    boxSizing: "content-box",
    height: "3.5rem",
    paddingBottom: "env(safe-area-inset-bottom)",
    backgroundColor: colors.navBg,
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: colors.navBorder,
    zIndex: 50,
  },
  tab: {
    flexGrow: 1,
    flexBasis: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    minWidth: 0,
  },
  inner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: "2px",
    paddingBlock: space.s1,
    paddingInline: space.s3,
    borderRadius: radius.lg,
    color: { default: colors.navIcon, ":hover": colors.navIconActive },
    transitionProperty: "color",
    transitionDuration: "120ms",
  },
  label: {
    fontSize: "0.625rem",
    lineHeight: 1,
    fontWeight: typography.weightMedium,
  },
});

export function MobileBottomNav() {
  const matches = useMatches();
  const path = matches.at(-1)?.pathname ?? "/";

  return (
    <nav {...stylex.props(styles.nav)} aria-label="Site sections">
      {NAV_SECTIONS.map((section) => (
        <Link key={section.to} to={section.to} {...stylex.props(styles.tab)}>
          <span {...stylex.props(styles.inner)}>
            <Icon type={section.isActive(path) ? section.iconActive : section.icon} size={22} />
            <span {...stylex.props(styles.label)}>{section.label}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
