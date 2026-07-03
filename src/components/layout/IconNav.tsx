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

// モバイル (< 768px) ではレールを隠し、MobileTopBar / MobileBottomNav に置き換える。
// 同一ファイルのフラットな文字列 const にする (StyleX media-query order の制約)。
const BP_TABLET = "@media (min-width: 768px)";

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
});

export function IconNav() {
  const matches = useMatches();
  const path = matches.at(-1)?.pathname ?? "/";

  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  useEffect(() => bindSlashShortcut(openSearch), [openSearch]);

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
        {NAV_SECTIONS.map((section) => (
          <Tooltip key={section.to} label={section.label}>
            <Link to={section.to} {...stylex.props(navChrome.iconButton)}>
              <Icon type={section.isActive(path) ? section.iconActive : section.icon} size={28} />
              <span {...stylex.props(a11y.srOnly)}>{section.label}</span>
            </Link>
          </Tooltip>
        ))}
        <div {...stylex.props(styles.spacer)} />
        <ThemeToggle />
      </nav>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
