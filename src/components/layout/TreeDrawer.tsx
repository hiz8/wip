import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { colors, shadow } from "@/styles/tokens.stylex.ts";

interface TreeDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

// ModalOverlay は isOpen=false のとき children を mount しないため、この keyframe は
// 「開くたびの mount 時」にのみ再生される (閉じるアニメーションは持たない)。
const slideIn = stylex.keyframes({
  from: { transform: "translateX(-100%)" },
  to: { transform: "translateX(0)" },
});

const styles = stylex.create({
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 1000,
  },
  modal: {
    position: "fixed",
    insetBlock: 0,
    insetInlineStart: 0,
    width: "16rem",
    maxWidth: "80vw",
    height: "100vh",
    backgroundColor: colors.bgSurface,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: colors.borderSubtle,
    boxShadow: shadow.lg,
    overflowY: "auto",
    animationName: slideIn,
    animationDuration: "180ms",
    animationTimingFunction: "ease-out",
  },
  dialog: {
    outline: "none",
    minHeight: "100%",
  },
});

// モバイル用 TreeSidebar ドロワー。範囲外クリック / Esc で閉じる (isDismissable)。
// フォーカストラップ・body スクロールロックは react-aria-components が担う。
export function TreeDrawer({ isOpen, onOpenChange, children }: TreeDrawerProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      {...stylex.props(styles.overlay)}
    >
      <Modal {...stylex.props(styles.modal)}>
        <Dialog aria-label="コンテンツツリー" {...stylex.props(styles.dialog)}>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
