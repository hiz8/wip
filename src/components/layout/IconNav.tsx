import { useCallback, useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, useMatches } from "@tanstack/react-router";
import { colors, space } from "@/styles/tokens.stylex.ts";
import { a11y } from "@/styles/a11y.ts";
import { navChrome } from "@/styles/navChrome.ts";
import { ThemeToggle } from "@/components/common/ThemeToggle.tsx";
import { Tooltip } from "@/components/common/Tooltip.tsx";
import { Icon } from "@/components/common/Icon.tsx";
import { SearchDialog } from "@/components/common/SearchDialog.tsx";
import { bindSlashShortcut } from "@/lib/search/slashShortcut.ts";
import { NAV_SECTIONS } from "./navSections.tsx";
import { NavOverflowMenu } from "./NavOverflowMenu.tsx";
import { useMenuSections } from "./useMenuSections.ts";

// モバイル (< 768px) ではレールを隠し、MobileTopBar / MobileBottomNav に置き換える。
// 同一ファイルのフラットな文字列 const にする (StyleX media-query order の制約)。
const BP_TABLET = "@media (min-width: 768px)";

// レールが各ボタンに 44px を確保できなくなる高さで、末端セクションからドットメニューへ
// 退避する。値は src/lib/nav/overflowThresholds.ts の desktopHideQuery(index) の出力。
// StyleX の制約でリテラルを直接持ち、テスト (navHideQueries) が導出式との一致を検証する。
const MQ_HIDE_NOTES = "@media (max-height: 340px)";
const MQ_HIDE_GLOSSARY = "@media (max-height: 400px)";
const MQ_HIDE_BOOKS = "@media (max-height: 460px)";
const MQ_HIDE_BLOG = "@media (max-height: 520px)";

// NAV_SECTIONS[1..] (Home は退避しない) に index を合わせた hide クエリ。
// CSS (下の styles) と useOverflowCount (メニュー内容) が同じ値を共有する。
export const RAIL_HIDE_QUERIES = [
  MQ_HIDE_NOTES,
  MQ_HIDE_GLOSSARY,
  MQ_HIDE_BOOKS,
  MQ_HIDE_BLOG,
] as const;

const styles = stylex.create({
  nav: {
    display: { default: "none", [BP_TABLET]: "flex" },
    flexDirection: "column",
    alignItems: "center",
    gap: space.s4,
    paddingBlock: space.s3,
    paddingInline: space.s2,
    width: "3.75rem",
    backgroundColor: colors.navBg,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: colors.navBorder,
    height: "100vh",
    boxSizing: "border-box",
    alignSelf: "start",
    overflowY: "auto",
    position: "sticky",
    top: 0,
  },
  spacer: {
    flexGrow: 1,
  },
  // navChrome.iconButton (display: inline-flex) と合成するため default も明示する
  // (StyleX は後勝ちでプロパティ全体を置き換える)。
  hideNotes: { display: { default: "inline-flex", [MQ_HIDE_NOTES]: "none" } },
  hideGlossary: { display: { default: "inline-flex", [MQ_HIDE_GLOSSARY]: "none" } },
  hideBooks: { display: { default: "inline-flex", [MQ_HIDE_BOOKS]: "none" } },
  hideBlog: { display: { default: "inline-flex", [MQ_HIDE_BLOG]: "none" } },
});

// NAV_SECTIONS と index を揃えた hide スタイル。Home (index 0) は退避しない。
const HIDE_STYLES = [
  null,
  styles.hideNotes,
  styles.hideGlossary,
  styles.hideBooks,
  styles.hideBlog,
];

export function IconNav() {
  const matches = useMatches();
  const path = matches.at(-1)?.pathname ?? "/";

  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  useEffect(() => bindSlashShortcut(openSearch), [openSearch]);

  const menuSections = useMenuSections(RAIL_HIDE_QUERIES);
  const menuHoldsActive = menuSections.some((section) => section.isActive(path));

  return (
    <>
      <nav {...stylex.props(styles.nav)} aria-label="Site sections">
        <Tooltip label="Search">
          <button
            type="button"
            onClick={openSearch}
            aria-label="Search (press /)"
            {...stylex.props(navChrome.iconButton)}
          >
            <Icon type="search" size={28} />
            <span {...stylex.props(a11y.srOnly)}>Search</span>
          </button>
        </Tooltip>
        <div {...stylex.props(styles.spacer)} />
        {NAV_SECTIONS.map((section, index) => (
          <Tooltip key={section.to} label={section.label}>
            <Link to={section.to} {...stylex.props(navChrome.iconButton, HIDE_STYLES[index])}>
              <Icon type={section.isActive(path) ? section.iconActive : section.icon} size={28} />
              <span {...stylex.props(a11y.srOnly)}>{section.label}</span>
            </Link>
          </Tooltip>
        ))}
        <NavOverflowMenu
          sections={menuSections}
          path={path}
          placement="end"
          label="More"
          withTooltip
          // 縦レールの並び軸に合わせて縦 3 点 (ケバブ)。横バーの MobileBottomNav は横 3 点。
          iconType={menuHoldsActive ? "menuDotsVerticalBold" : "menuDotsVertical"}
          triggerStyle={navChrome.iconButton}
        />
        <div {...stylex.props(styles.spacer)} />
        <ThemeToggle />
      </nav>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
