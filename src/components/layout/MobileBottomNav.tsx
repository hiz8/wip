import * as stylex from "@stylexjs/stylex";
import { Link, useMatches } from "@tanstack/react-router";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";
import { Icon } from "@/components/common/Icon.tsx";
import { NAV_SECTIONS } from "./navSections.tsx";
import { NavOverflowMenu } from "./NavOverflowMenu.tsx";
import { useMenuSections } from "./useMenuSections.ts";

// モバイル (< 768px) 限定。≥ 768 では非表示にしデスクトップの IconNav に戻す。
// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約)。
const BP_TABLET = "@media (min-width: 768px)";

// タブ 1 個の幅が 56px 以下になる幅で、末端セクションからドットメニューへ退避する。
// 値は src/lib/nav/overflowThresholds.ts の mobileHideQuery(index) の出力。
// StyleX の制約でリテラルを直接持ち、テスト (navHideQueries) が導出式との一致を検証する。
const MQ_HIDE_NOTES = "@media (max-width: 168px)";
const MQ_HIDE_GLOSSARY = "@media (max-width: 224px)";
const MQ_HIDE_BOOKS = "@media (max-width: 280px)";
const MQ_HIDE_BLOG = "@media (max-width: 336px)";

// NAV_SECTIONS[1..] (Home は退避しない) に index を合わせた hide クエリ。
// CSS (下の styles) と useOverflowCount (メニュー内容) が同じ値を共有する。
export const BAR_HIDE_QUERIES = [
  MQ_HIDE_NOTES,
  MQ_HIDE_GLOSSARY,
  MQ_HIDE_BOOKS,
  MQ_HIDE_BLOG,
] as const;

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
  // styles.tab (display: flex) と合成するため default も明示する (StyleX は後勝ちで
  // プロパティ全体を置き換える)。
  hideNotes: { display: { default: "flex", [MQ_HIDE_NOTES]: "none" } },
  hideGlossary: { display: { default: "flex", [MQ_HIDE_GLOSSARY]: "none" } },
  hideBooks: { display: { default: "flex", [MQ_HIDE_BOOKS]: "none" } },
  hideBlog: { display: { default: "flex", [MQ_HIDE_BLOG]: "none" } },
  // ドットトリガーをタブと同じ見た目にするための button リセット込みスタイル。
  menuTab: {
    flexGrow: 1,
    flexBasis: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    padding: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    cursor: "pointer",
  },
});

// NAV_SECTIONS と index を揃えた hide スタイル。Home (index 0) は退避しない。
const HIDE_STYLES = [
  null,
  styles.hideNotes,
  styles.hideGlossary,
  styles.hideBooks,
  styles.hideBlog,
];

export function MobileBottomNav() {
  const matches = useMatches();
  const path = matches.at(-1)?.pathname ?? "/";

  const menuSections = useMenuSections(BAR_HIDE_QUERIES);
  const menuHoldsActive = menuSections.some((section) => section.isActive(path));

  return (
    <nav {...stylex.props(styles.nav)} aria-label="Site sections">
      {NAV_SECTIONS.map((section, index) => (
        <Link key={section.to} to={section.to} {...stylex.props(styles.tab, HIDE_STYLES[index])}>
          <span {...stylex.props(styles.inner)}>
            <Icon type={section.isActive(path) ? section.iconActive : section.icon} size={22} />
            <span {...stylex.props(styles.label)}>{section.label}</span>
          </span>
        </Link>
      ))}
      <NavOverflowMenu
        sections={menuSections}
        path={path}
        placement="top"
        label="More"
        triggerStyle={styles.menuTab}
      >
        <span {...stylex.props(styles.inner)}>
          <Icon type={menuHoldsActive ? "menuDotsBold" : "menuDots"} size={22} />
          <span {...stylex.props(styles.label)}>More</span>
        </span>
      </NavOverflowMenu>
    </nav>
  );
}
