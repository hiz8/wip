import { useEffect, useRef } from "react";
import * as stylex from "@stylexjs/stylex";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { colors, radius, shadow, space } from "@/styles/tokens.stylex.ts";
import {
  PAGEFIND_BUNDLE_PATH,
  PAGEFIND_CSS_HREF,
  makePagefindUIOptions,
} from "@/lib/search/pagefindOptions.ts";
import "@/lib/search/pagefind-overrides.css";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PagefindUIConstructor {
  new (options: ReturnType<typeof makePagefindUIOptions>): unknown;
}

declare global {
  interface Window {
    PagefindUI?: PagefindUIConstructor;
  }
}

const styles = stylex.create({
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingBlock: `clamp(${space.s5}, 6vh, ${space.s8})`,
    paddingInline: `clamp(${space.s2}, 4vw, ${space.s6})`,
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: "44rem",
  },
  dialog: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    boxShadow: shadow.lg,
    paddingBlock: `clamp(${space.s3}, 3vw, ${space.s5})`,
    paddingInline: `clamp(${space.s3}, 3vw, ${space.s5})`,
    outline: "none",
    color: colors.textPrimary,
  },
  pagefindContainer: {
    color: colors.textPrimary,
  },
});

let pagefindUiPromise: Promise<PagefindUIConstructor> | null = null;

// pagefind-ui.js は ESM ではなく、window.PagefindUI を生やす IIFE。公式の
// ロード手順 (https://pagefind.app/docs/ui/) どおり <script> タグで読み込む。
// dynamic import では module namespace に export が無く constructor を得られない。
function loadPagefindUi(): Promise<PagefindUIConstructor> {
  if (pagefindUiPromise === null) {
    pagefindUiPromise = new Promise<PagefindUIConstructor>((resolve, reject) => {
      if (window.PagefindUI) {
        resolve(window.PagefindUI);
        return;
      }
      const script = document.createElement("script");
      script.src = PAGEFIND_BUNDLE_PATH;
      script.addEventListener("load", () => {
        if (window.PagefindUI) {
          resolve(window.PagefindUI);
        } else {
          reject(new Error(`PagefindUI global not found after loading ${PAGEFIND_BUNDLE_PATH}`));
        }
      });
      script.addEventListener("error", () => {
        reject(new Error(`Failed to load ${PAGEFIND_BUNDLE_PATH}`));
      });
      document.head.append(script);
    });
  }
  return pagefindUiPromise;
}

function injectPagefindCss(): void {
  if (typeof document === "undefined") return;
  const existing = document.querySelector(`link[href="${PAGEFIND_CSS_HREF}"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = PAGEFIND_CSS_HREF;
  document.head.append(link);
}

async function mountPagefindUI(container: HTMLElement): Promise<void> {
  const PagefindUI = await loadPagefindUi();
  // Pagefind UI は副作用で自身を設置する。インスタンスは意図的に保持しない。
  void new PagefindUI(makePagefindUIOptions(container));
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const container = containerRef.current;
    if (!container || mountedRef.current) return;
    injectPagefindCss();
    let cancelled = false;
    void (async () => {
      try {
        await mountPagefindUI(container);
        if (!cancelled) mountedRef.current = true;
      } catch (error) {
        console.error("[search] failed to load Pagefind UI", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <ModalOverlay
      isOpen={open}
      onOpenChange={onOpenChange}
      isDismissable
      {...stylex.props(styles.overlay)}
    >
      <Modal {...stylex.props(styles.modal)}>
        <Dialog aria-label="サイト内検索" {...stylex.props(styles.dialog)}>
          <div ref={containerRef} {...stylex.props(styles.pagefindContainer)} />
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
