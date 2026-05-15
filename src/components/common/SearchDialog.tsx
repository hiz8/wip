import { useEffect, useRef } from "react";
import * as stylex from "@stylexjs/stylex";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { colors, radius, shadow, space } from "@/styles/tokens.stylex.ts";
import {
  PAGEFIND_BUNDLE_PATH,
  PAGEFIND_CSS_HREF,
  makePagefindUIOptions,
} from "@/lib/search/pagefindOptions.ts";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PagefindUIConstructor {
  new (options: ReturnType<typeof makePagefindUIOptions>): unknown;
}

interface PagefindUIModule {
  PagefindUI: PagefindUIConstructor;
}

const styles = stylex.create({
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingBlock: space.s8,
    paddingInline: space.s4,
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
    padding: space.s4,
    outline: "none",
    color: colors.textPrimary,
  },
  pagefindContainer: {
    color: colors.textPrimary,
  },
});

let pagefindModulePromise: Promise<PagefindUIModule> | null = null;

function loadPagefindModule(): Promise<PagefindUIModule> {
  if (pagefindModulePromise === null) {
    // The bundle is served from /pagefind by the post-build script; Vite must
    // not try to resolve it at build time, hence the runtime URL.
    const dynamicImport = import(PAGEFIND_BUNDLE_PATH);
    pagefindModulePromise = dynamicImport as Promise<PagefindUIModule>;
  }
  return pagefindModulePromise;
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
  const mod = await loadPagefindModule();
  // Pagefind UI installs itself via side effect; the instance is intentionally
  // not retained.
  void new mod.PagefindUI(makePagefindUIOptions(container));
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
