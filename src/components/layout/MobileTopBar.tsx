import { useCallback, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors, space } from "@/styles/tokens.stylex.ts";
import { a11y } from "@/styles/a11y.ts";
import { navChrome } from "@/styles/navChrome.ts";
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
          {...stylex.props(navChrome.iconButton)}
        >
          <SearchIcon />
          <span {...stylex.props(a11y.srOnly)}>Search</span>
        </button>
        <ThemeToggle />
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
