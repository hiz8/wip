import * as stylex from "@stylexjs/stylex";
import { Link, useMatches } from "@tanstack/react-router";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import { HomeIcon } from "@/components/common/HomeIcon.tsx";

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
    transitionProperty: "color, background-color",
    transitionDuration: "120ms",
  },
  innerActive: {
    color: colors.navIconActive,
    backgroundColor: colors.navItemActiveBg,
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
  const onHome = path === "/";
  const onNotes = path === "/notes" || path.startsWith("/notes/");
  const onGlossary = path === "/glossary" || path.startsWith("/glossary/");
  const onBooks = path === "/books" || path.startsWith("/books/");

  return (
    <nav {...stylex.props(styles.nav)} aria-label="Site sections">
      <Link to="/" {...stylex.props(styles.tab)}>
        <span {...stylex.props(styles.inner, onHome && styles.innerActive)}>
          <HomeIcon size={22} />
          <span {...stylex.props(styles.label)}>Home</span>
        </span>
      </Link>
      <Link to="/notes" {...stylex.props(styles.tab)}>
        <span {...stylex.props(styles.inner, onNotes && styles.innerActive)}>
          <ContentTypeIcon type="notes" size={22} />
          <span {...stylex.props(styles.label)}>Notes</span>
        </span>
      </Link>
      <Link to="/glossary" {...stylex.props(styles.tab)}>
        <span {...stylex.props(styles.inner, onGlossary && styles.innerActive)}>
          <ContentTypeIcon type="glossary" size={22} />
          <span {...stylex.props(styles.label)}>Glossary</span>
        </span>
      </Link>
      <Link to="/books" {...stylex.props(styles.tab)}>
        <span {...stylex.props(styles.inner, onBooks && styles.innerActive)}>
          <ContentTypeIcon type="books" size={22} />
          <span {...stylex.props(styles.label)}>Books</span>
        </span>
      </Link>
    </nav>
  );
}
