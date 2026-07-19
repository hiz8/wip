import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { space, typography } from "@/styles/tokens.stylex.ts";

interface DetailLayoutProps {
  children: ReactNode;
  hasMarginalia: boolean;
}

// ブレイクポイントを同一ファイル内のフラットな文字列 const にしている理由は
// AppShell.tsx を参照 (defineConsts のファイルまたぎ参照は
// `enableMediaQueryOrder` をバイパスする)。
const BP_DESKTOP = "@media (min-width: 1024px)";
const BP_DESKTOP_WIDE = "@media (min-width: 1280px)";

// 3 段のトラックを中央寄せし、トラック自体より広い viewport でも float の
// 受け皿となるガターが main 列と揃ったままになるようにする。
const styles = stylex.create({
  wrapper: {
    display: "grid",
    justifyContent: "center",
    gap: space.s5,
  },
  // marginalia がないページ向けの 1 列レイアウト: 中央寄せした読み用の列だけ。
  // ガターセルを確保しないため、狭い viewport は幅を保ち、広い viewport は
  // 使われない余白を畳む。
  wrapperSingle: {
    gridTemplateColumns: "minmax(0, 44rem)",
    gridTemplateAreas: '"main"',
  },
  // marginalia がある場合: 固定 44rem の main 列の脇に 12rem のガターを確保し、
  // 負マージンの float が予測通りに着地するようにする。>=1024px で右ガター、
  // >=1280px で左右両方のガター。
  wrapperWithMarginalia: {
    gridTemplateColumns: {
      default: "minmax(0, 44rem)",
      [BP_DESKTOP]: "minmax(0, 44rem) 12rem",
      [BP_DESKTOP_WIDE]: "12rem minmax(0, 44rem) 12rem",
    },
    gridTemplateAreas: {
      default: '"main"',
      [BP_DESKTOP]: '"main right-margin"',
      [BP_DESKTOP_WIDE]: '"left-margin main right-margin"',
    },
  },
  // 確保用のガターセル。marginalia コンテンツはここには mount されない:
  // callout と footnote の aside は main 列の HTML 内に存在し、負マージンの
  // float でこれらのセルへ逃げ出す。空の div は、float が着地する物理的な
  // スペースを grid が依然として割り当てるために存在する。
  leftMargin: {
    gridRowStart: "left-margin",
    gridRowEnd: "left-margin",
    gridColumnStart: "left-margin",
    gridColumnEnd: "left-margin",
    display: { default: "none", [BP_DESKTOP_WIDE]: "block" },
  },
  rightMargin: {
    gridRowStart: "right-margin",
    gridRowEnd: "right-margin",
    gridColumnStart: "right-margin",
    gridColumnEnd: "right-margin",
    display: { default: "none", [BP_DESKTOP]: "block" },
  },
  main: {
    gridRowStart: "main",
    gridRowEnd: "main",
    gridColumnStart: "main",
    gridColumnEnd: "main",
    minWidth: 0,
    fontSize: typography.fontSizeMd,
    lineHeight: typography.lineHeightRelaxed,
  },
});

export function DetailLayout({ children, hasMarginalia }: DetailLayoutProps) {
  return (
    <div
      {...stylex.props(
        styles.wrapper,
        hasMarginalia ? styles.wrapperWithMarginalia : styles.wrapperSingle,
      )}
    >
      {hasMarginalia ? <div {...stylex.props(styles.leftMargin)} aria-hidden="true" /> : null}
      <div {...stylex.props(styles.main)}>{children}</div>
      {hasMarginalia ? <div {...stylex.props(styles.rightMargin)} aria-hidden="true" /> : null}
    </div>
  );
}
