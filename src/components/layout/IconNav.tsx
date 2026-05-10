import * as stylex from "@stylexjs/stylex";
import { Link, useMatches } from "@tanstack/react-router";
import { colors, radius, space } from "@/styles/tokens.stylex.ts";
import { ThemeToggle } from "@/components/common/ThemeToggle.tsx";

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
    minHeight: "100vh",
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
  iconButtonDisabled: {
    color: colors.textMuted,
    cursor: "not-allowed",
    opacity: 0.5,
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
    border: 0,
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

function NotesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 3h9l5 5v13H6zM15 3v5h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 13h7M9 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function GlossaryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 17h14" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function BooksIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="5" height="16" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10" y="4" width="5" height="16" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M16 5l4 1-3 15-4-1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconNav() {
  const matches = useMatches();
  const path = matches[matches.length - 1]?.pathname ?? "/";
  const onNotes = path === "/notes" || path.startsWith("/notes/");

  return (
    <nav {...stylex.props(styles.nav)} aria-label="Site sections">
      <Link to="/" {...stylex.props(styles.iconButton, path === "/" && styles.iconButtonActive)}>
        <HomeIcon />
        <span {...stylex.props(styles.srOnly)}>Home</span>
      </Link>
      <Link to="/notes" {...stylex.props(styles.iconButton, onNotes && styles.iconButtonActive)}>
        <NotesIcon />
        <span {...stylex.props(styles.srOnly)}>Notes</span>
      </Link>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Glossary — Coming soon"
        {...stylex.props(styles.iconButton, styles.iconButtonDisabled)}
      >
        <GlossaryIcon />
        <span {...stylex.props(styles.srOnly)}>Glossary (coming soon)</span>
      </button>
      <button
        type="button"
        disabled
        aria-disabled="true"
        title="Books — Coming soon"
        {...stylex.props(styles.iconButton, styles.iconButtonDisabled)}
      >
        <BooksIcon />
        <span {...stylex.props(styles.srOnly)}>Books (coming soon)</span>
      </button>
      <div {...stylex.props(styles.spacer)} />
      <ThemeToggle />
    </nav>
  );
}
