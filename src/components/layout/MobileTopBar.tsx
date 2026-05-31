import { useCallback, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, radius, space } from "@/styles/tokens.stylex.ts";
import { ThemeToggle } from "@/components/common/ThemeToggle.tsx";
import { SearchIcon } from "@/components/common/SearchIcon.tsx";
import { SearchDialog } from "@/components/common/SearchDialog.tsx";

// モバイル (< 768px) 限定。レールから外した検索 / テーマ切替をここに置く。
// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約)。
const BP_TABLET = "@media (min-width: 768px)";

// 高さは AppShell の body 上パディング (`3rem`) と同期させること。
const styles = stylex.create({
  bar: {
    position: "fixed",
    insetInlineStart: 0,
    insetInlineEnd: 0,
    top: 0,
    display: { default: "flex", [BP_TABLET]: "none" },
    alignItems: "center",
    justifyContent: "flex-end",
    gap: space.s1,
    height: "3rem",
    paddingInline: space.s3,
    backgroundColor: colors.navBg,
    borderBlockEndWidth: 1,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: colors.navBorder,
    zIndex: 50,
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

export function MobileTopBar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const openSearch = useCallback(() => setSearchOpen(true), []);
  return (
    <>
      <div {...stylex.props(styles.bar)}>
        <button
          type="button"
          onClick={openSearch}
          aria-label="Search"
          {...stylex.props(styles.iconButton)}
        >
          <SearchIcon />
          <span {...stylex.props(styles.srOnly)}>Search</span>
        </button>
        <ThemeToggle />
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
