import { useCallback, useEffect, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, useMatches } from "@tanstack/react-router";
import { colors, radius, space } from "@/styles/tokens.stylex.ts";
import { ThemeToggle } from "@/components/common/ThemeToggle.tsx";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import { SearchIcon } from "@/components/common/SearchIcon.tsx";
import { SearchDialog } from "@/components/common/SearchDialog.tsx";
import { bindSlashShortcut } from "@/lib/search/slashShortcut.ts";

const styles = stylex.create({
  nav: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.s2,
    paddingBlock: space.s3,
    paddingInline: space.s2,
    width: "3.25rem",
    backgroundColor: colors.bgSurface,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: colors.borderSubtle,
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
    borderRadius: radius.md,
    color: colors.textSecondary,
    backgroundColor: { default: "transparent", ":hover": colors.bgElevated },
    transitionProperty: "color, background-color",
    transitionDuration: "120ms",
  },
  iconButtonActive: {
    color: colors.accent,
    backgroundColor: colors.bgElevated,
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

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
