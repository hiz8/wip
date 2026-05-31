import { useCallback, useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, useMatches } from "@tanstack/react-router";
import { colors, radius, space } from "@/styles/tokens.stylex.ts";
import { ThemeToggle } from "@/components/common/ThemeToggle.tsx";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import { HomeIcon } from "@/components/common/HomeIcon.tsx";
import { SearchIcon } from "@/components/common/SearchIcon.tsx";
import { SearchDialog } from "@/components/common/SearchDialog.tsx";
import { bindSlashShortcut } from "@/lib/search/slashShortcut.ts";

// モバイル (< 768px) ではレールを隠し、MobileTopBar / MobileBottomNav に置き換える。
// 同一ファイルのフラットな文字列 const にする (StyleX media-query order の制約)。
const BP_TABLET = "@media (min-width: 768px)";

const styles = stylex.create({
  nav: {
    display: { default: "none", [BP_TABLET]: "flex" },
    flexDirection: "column",
    alignItems: "center",
    gap: space.s2,
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
  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.25rem",
    height: "2.25rem",
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
  spacer: {
    flexGrow: 1,
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});

export function IconNav() {
  const matches = useMatches();
  const path = matches.at(-1)?.pathname ?? "/";
  const onNotes = path === "/notes" || path.startsWith("/notes/");
  const onGlossary = path === "/glossary" || path.startsWith("/glossary/");
  const onBooks = path === "/books" || path.startsWith("/books/");

  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  useEffect(() => bindSlashShortcut(openSearch), [openSearch]);

  return (
    <>
      <nav {...stylex.props(styles.nav)} aria-label="Site sections">
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search (press /)"
          {...stylex.props(styles.iconButton)}
        >
          <SearchIcon />
          <span {...stylex.props(styles.srOnly)}>Search</span>
        </button>
        <Link to="/" {...stylex.props(styles.iconButton, path === "/" && styles.iconButtonActive)}>
          <HomeIcon />
          <span {...stylex.props(styles.srOnly)}>Home</span>
        </Link>
        <Link to="/notes" {...stylex.props(styles.iconButton, onNotes && styles.iconButtonActive)}>
          <ContentTypeIcon type="notes" />
          <span {...stylex.props(styles.srOnly)}>Notes</span>
        </Link>
        <Link
          to="/glossary"
          {...stylex.props(styles.iconButton, onGlossary && styles.iconButtonActive)}
        >
          <ContentTypeIcon type="glossary" />
          <span {...stylex.props(styles.srOnly)}>Glossary</span>
        </Link>
        <Link to="/books" {...stylex.props(styles.iconButton, onBooks && styles.iconButtonActive)}>
          <ContentTypeIcon type="books" />
          <span {...stylex.props(styles.srOnly)}>Books</span>
        </Link>
        <div {...stylex.props(styles.spacer)} />
        <ThemeToggle />
      </nav>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
