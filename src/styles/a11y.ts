import * as stylex from "@stylexjs/stylex";

// スクリーンリーダー専用テキスト。視覚的には隠すが読み上げ・フォーカスには残す
// (icon-only ボタンのラベル等)。IconNav / MobileTopBar / ThemeToggle で共有する。
export const a11y = stylex.create({
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
