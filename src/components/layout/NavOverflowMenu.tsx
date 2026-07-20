import type { ReactNode } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  Button,
  Menu,
  MenuItem,
  type MenuItemProps,
  type MenuItemRenderProps,
  MenuTrigger,
  Popover,
  Text,
  TooltipTrigger,
} from "react-aria-components";
import { createLink } from "@tanstack/react-router";
import { colors, radius, shadow, space, typography } from "@/styles/tokens.stylex.ts";
import { Icon, type IconType } from "@/components/common/Icon.tsx";
import { TooltipBubble } from "@/components/common/Tooltip.tsx";
import type { MenuNavSection } from "./navSections.tsx";

const styles = stylex.create({
  // Popover は body 直下の portal に出るため、MobileBottomNav (zIndex: 50) より上に載せる。
  popover: {
    zIndex: 100,
  },
  menu: {
    minWidth: "10rem",
    padding: space.s1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    boxShadow: shadow.lg,
    outline: "none",
  },
  item: {
    display: "grid",
    // 先頭はアイコンスロット。アイコンなしの項目も空のまま描画し、ラベル位置を揃える。
    gridTemplateColumns: "1.25rem 1fr",
    columnGap: space.s2,
    alignItems: "center",
    paddingBlock: space.s2,
    paddingInline: space.s2,
    borderRadius: radius.sm,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightTight,
    textDecoration: "none",
    cursor: "pointer",
    outline: "none",
  },
  itemFocused: {
    backgroundColor: colors.selectedBg,
  },
  itemIcon: {
    display: "inline-flex",
    justifyContent: "center",
  },
  itemLabelActive: {
    fontWeight: typography.weightSemibold,
  },
});

// 項目のハイライトは render prop の className で StyleX クラスを切り替える
// (Tooltip.tsx と同じ、react-aria・StyleX 双方の公式 API だけで完結する方式)。
// ARIA メニューではホバーでもフォーカスが項目へ移るため、isFocused だけで両状態を賄える。
function itemClassName({ isFocused }: MenuItemRenderProps) {
  return stylex.props(styles.item, isFocused && styles.itemFocused).className ?? "";
}

function StyledMenuItem(props: Omit<MenuItemProps, "className">) {
  return <MenuItem {...props} className={itemClassName} />;
}

// TanStack Router 公式の react-aria-components 統合。createLink でラップすると
// MenuItem がルーターの型付き `to` を受け取り、クライアントサイド遷移になる。
// https://tanstack.com/router/latest/docs/framework/react/guide/custom-link
const MenuItemLink = createLink(StyledMenuItem);

interface NavOverflowMenuProps {
  // メニューに出すセクション (ビューポート起因の退避分 + 常時メニュー分)。順序は呼び出し側が保つ。
  sections: MenuNavSection[];
  path: string;
  placement: "end" | "top";
  // トリガーの aria-label 兼 (withTooltip 時の) ツールチップ文言。
  label: string;
  withTooltip?: boolean;
  // トリガーの見た目は設置先 (レール / ボトムバー) が指定する。配列は状態別の重ね掛け用。
  triggerStyle?:
    | stylex.StyleXStyles
    | ReadonlyArray<stylex.StyleXStyles | false | null | undefined>;
  // 省略時トリガーに出すドットアイコン。並び軸に合わせて呼び出し側が選ぶ
  // (縦レール = menuDotsVertical / 横バー = menuDots)。children 指定時は無視。
  iconType?: IconType;
  // トリガー Button の中身。省略時は iconType のドットアイコンのみ。
  children?: ReactNode;
}

// ナビの「ドットメニュー」。常時メニュー配下のセクション (Works など) と、
// ビューポートが狭くバーから退避したセクションをまとめて表示する。
export function NavOverflowMenu({
  sections,
  path,
  placement,
  label,
  withTooltip = false,
  triggerStyle,
  iconType = "menuDots",
  children,
}: NavOverflowMenuProps) {
  const trigger = (
    <Button aria-label={label} {...stylex.props(triggerStyle)}>
      {children ?? <Icon type={iconType} size={28} />}
    </Button>
  );
  return (
    <MenuTrigger>
      {withTooltip ? (
        <TooltipTrigger delay={0} closeDelay={0}>
          {trigger}
          <TooltipBubble>{label}</TooltipBubble>
        </TooltipTrigger>
      ) : (
        trigger
      )}
      <Popover placement={placement} offset={8} {...stylex.props(styles.popover)}>
        <Menu aria-label={label} {...stylex.props(styles.menu)}>
          {sections.map((section) => {
            const active = section.isActive(path);
            const sectionIconType =
              active && section.iconActive ? section.iconActive : section.icon;
            return (
              <MenuItemLink key={section.to} to={section.to} textValue={section.label}>
                <span {...stylex.props(styles.itemIcon)} aria-hidden>
                  {sectionIconType ? <Icon type={sectionIconType} size={18} /> : null}
                </span>
                <Text slot="label" {...stylex.props(active && styles.itemLabelActive)}>
                  {section.label}
                </Text>
              </MenuItemLink>
            );
          })}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
