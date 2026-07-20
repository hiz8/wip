import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Dialog, Modal, type ModalRenderProps, ModalOverlay } from "react-aria-components";
import { colors, shadow } from "@/styles/tokens.stylex.ts";

interface TreeDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

const DECELERATE = "cubic-bezier(0, 0, 0.2, 1)";
const ACCELERATE = "cubic-bezier(0.4, 0, 1, 1)";
const DURATION_ENTER = "250ms";
const DURATION_EXIT = "200ms";

const slideIn = stylex.keyframes({
  from: { transform: "translateX(-100%)" },
  to: { transform: "translateX(0)" },
});
const slideOut = stylex.keyframes({
  from: { transform: "translateX(0)" },
  to: { transform: "translateX(-100%)" },
});

// opacity ではなく backgroundColor を対象にすることで、overlay の子である
// Modal パネルは薄くならず slide だけで表示される。
const fadeIn = stylex.keyframes({
  from: { backgroundColor: "rgba(0, 0, 0, 0)" },
  to: { backgroundColor: "rgba(0, 0, 0, 0.45)" },
});
const fadeOut = stylex.keyframes({
  from: { backgroundColor: "rgba(0, 0, 0, 0.45)" },
  to: { backgroundColor: "rgba(0, 0, 0, 0)" },
});

const styles = stylex.create({
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 1000,
  },
  overlayEntering: {
    animationName: fadeIn,
    animationDuration: DURATION_ENTER,
    animationTimingFunction: DECELERATE,
  },
  overlayExiting: {
    animationName: fadeOut,
    animationDuration: DURATION_EXIT,
    animationTimingFunction: ACCELERATE,
    // 消える直前に表示状態へ戻る flash を防ぐため終了フレームを保持する。
    animationFillMode: "forwards",
  },
  modal: {
    position: "fixed",
    insetBlock: 0,
    insetInlineStart: 0,
    width: "16rem",
    maxWidth: "80vw",
    backgroundColor: colors.bgSurface,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: colors.borderSubtle,
    boxShadow: shadow.lg,
    overflowY: "auto",
  },
  modalEntering: {
    animationName: slideIn,
    animationDuration: DURATION_ENTER,
    animationTimingFunction: DECELERATE,
  },
  modalExiting: {
    animationName: slideOut,
    animationDuration: DURATION_EXIT,
    animationTimingFunction: ACCELERATE,
    animationFillMode: "forwards",
  },
  dialog: {
    outline: "none",
    minHeight: "100%",
  },
});

// enter/exit は react-aria の render prop (isEntering/isExiting) で条件クラスを当てる。
// StyleX 側で [data-entering] 等の属性セレクタを条件に使う手もあるが未ドキュメントの挙動のため、
// react-aria・StyleX 双方の公式 API だけで完結するこちらを採用する (Tooltip と同一方針)。
// 毎レンダーでの関数再生成を避けるためモジュールスコープに切り出す。
function overlayClassName({ isEntering, isExiting }: ModalRenderProps) {
  return (
    stylex.props(
      styles.overlay,
      isEntering && styles.overlayEntering,
      isExiting && styles.overlayExiting,
    ).className ?? ""
  );
}

function modalClassName({ isEntering, isExiting }: ModalRenderProps) {
  return (
    stylex.props(styles.modal, isEntering && styles.modalEntering, isExiting && styles.modalExiting)
      .className ?? ""
  );
}

// モバイル用 TreeSidebar ドロワー。範囲外クリック / Esc で閉じる (isDismissable)。
// フォーカストラップ・body スクロールロックは react-aria-components が担う。
// isExiting の間は react-aria がマウントを保持し、閉じるアニメーション完了後に unmount する。
export function TreeDrawer({ isOpen, onOpenChange, children }: TreeDrawerProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      className={overlayClassName}
    >
      <Modal className={modalClassName}>
        <Dialog aria-label="コンテンツツリー" {...stylex.props(styles.dialog)}>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
