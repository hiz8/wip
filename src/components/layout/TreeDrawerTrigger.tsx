import * as stylex from "@stylexjs/stylex";
import { colors, radius } from "@/styles/tokens.stylex.ts";
import { a11y } from "@/styles/a11y.ts";
import { Icon } from "@/components/common/Icon.tsx";
import { useTreeDrawer } from "./TreeDrawerContext.tsx";

// StyleX の media-query 順序制約により同一ファイルのフラット文字列 const にする
// (AppShell.tsx の BP_TABLET と同じ理由)。
const BP_TABLET = "@media (min-width: 768px)";

const styles = stylex.create({
  button: {
    display: { default: "inline-flex", [BP_TABLET]: "none" },
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
    padding: 0,
    borderStyle: "none",
    borderRadius: radius.sm,
    color: { default: colors.textMuted, ":hover": colors.link },
    backgroundColor: { default: "transparent", ":hover": colors.hoverBg },
    cursor: "pointer",
    flexShrink: 0,
  },
});

// モバイル (< 768px) 限定。パンくずの先頭に置き、クリックでツリードロワーを開く。
// ツリーを持たないページ (hasTree=false) では描画しない。
export function TreeDrawerTrigger() {
  const { hasTree, open } = useTreeDrawer();
  if (!hasTree) return null;
  return (
    <button
      type="button"
      onClick={open}
      aria-label="コンテンツツリーを開く"
      {...stylex.props(styles.button)}
    >
      <Icon type="panelLeft" size={20} />
      <span {...stylex.props(a11y.srOnly)}>コンテンツツリーを開く</span>
    </button>
  );
}
