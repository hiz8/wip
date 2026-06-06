import type { ComponentProps } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  Focusable,
  Tooltip as AriaTooltip,
  type TooltipRenderProps,
  TooltipTrigger,
} from "react-aria-components";
import { radius, shadow, space, typography } from "@/styles/tokens.stylex.ts";

const fade = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const styles = stylex.create({
  tooltip: {
    backgroundColor: "var(--brand-tooltip)",
    color: "#fff",
    borderRadius: radius.sm,
    boxShadow: shadow.lg,
    paddingBlock: space.s2,
    paddingInline: space.s3,
    fontSize: typography.fontSizeXs,
    lineHeight: typography.lineHeightTight,
    whiteSpace: "nowrap",
  },
  entering: {
    animationName: fade,
    animationDuration: "100ms",
  },
  exiting: {
    animationName: fade,
    animationDuration: "50ms",
    animationDirection: "reverse",
    animationTimingFunction: "ease-in",
    animationFillMode: "forwards",
  },
});

// enter/exit は react-aria の render prop (isEntering/isExiting) で条件クラスを当てる。
// StyleX 側で [data-entering] 等の属性セレクタを条件に使う手もあるが未ドキュメントの挙動のため、
// react-aria・StyleX 双方の公式 API だけで完結するこちらを採用する。
// 毎レンダーでの関数再生成を避けるためモジュールスコープに切り出す。
function tooltipClassName({ isEntering, isExiting }: TooltipRenderProps) {
  return (
    stylex.props(styles.tooltip, isEntering && styles.entering, isExiting && styles.exiting)
      .className ?? ""
  );
}

// アイコンのみのトリガーにホバー/フォーカスでラベルを表示する薄いラッパー。
// children は単一の focusable 要素 (TanStack の Link や素の button)。
// react-aria 製でない要素を Focusable でラップしてホバー/フォーカス配線を成立させる。
// children の型は Focusable が要求する型 (ReactElement<DOMAttributes, string>) に揃える。
export function Tooltip({
  label,
  children,
}: {
  label: string;
  children: ComponentProps<typeof Focusable>["children"];
}) {
  return (
    <TooltipTrigger delay={0} closeDelay={0}>
      <Focusable>{children}</Focusable>
      <AriaTooltip placement="end" offset={8} className={tooltipClassName}>
        {label}
      </AriaTooltip>
    </TooltipTrigger>
  );
}
