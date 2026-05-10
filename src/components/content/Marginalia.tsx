import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import * as stylex from "@stylexjs/stylex";
import { computeMarginaliaPlacements } from "@/lib/marginalia/index.ts";
import { MarginaliaCallout, MarginaliaFootnote } from "./MarginaliaItem.tsx";
import type { CalloutEntry, FootnoteEntry } from "@/types/content.ts";
import { space } from "@/styles/tokens.stylex.ts";

export type MarginaliaSide = "left" | "right";

interface MarginaliaProps {
  side: MarginaliaSide;
  contentRef: RefObject<HTMLElement | null>;
  footnotes: readonly FootnoteEntry[];
  callouts: readonly CalloutEntry[];
}

interface ResolvedMarginaliaItem {
  key: string;
  side: MarginaliaSide;
  top: number;
  node: ReactNode;
}

interface PendingItem {
  key: string;
  side: MarginaliaSide;
  measure: { id: string; top: number; height: number };
  node: ReactNode;
}

const styles = stylex.create({
  container: {
    position: "relative",
    minHeight: "100%",
    paddingInline: space.s2,
  },
  item: {
    position: "absolute",
    insetInlineStart: 0,
    insetInlineEnd: 0,
    paddingInline: space.s1,
  },
});

export function Marginalia({ side, contentRef, footnotes, callouts }: MarginaliaProps) {
  const [items, setItems] = useState<ResolvedMarginaliaItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const content = contentRef.current;
    if (!content) return;

    let frame = 0;
    let cancelled = false;

    const recompute = () => {
      if (cancelled) return;
      const pending = collectPending(content, footnotes, callouts, side);
      const placed = computeMarginaliaPlacements(pending.map((p) => p.measure));
      const map = new Map(placed.map((p) => [p.id, p.top]));
      const next: ResolvedMarginaliaItem[] = [];
      for (const item of pending) {
        const top = map.get(item.measure.id);
        if (top === undefined) continue;
        next.push({ key: item.key, side: item.side, top, node: item.node });
      }
      setItems(next);
    };

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(recompute);
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    ro.observe(content);

    const mo = new MutationObserver(schedule);
    mo.observe(content, { childList: true, subtree: true, attributes: true });

    window.addEventListener("resize", schedule);

    return () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [contentRef, footnotes, callouts, side]);

  if (footnotes.length === 0 && callouts.length === 0) return null;

  return (
    <aside
      {...stylex.props(styles.container)}
      data-marginalia-side={side}
      aria-label={side === "left" ? "Left marginalia" : "Right marginalia"}
    >
      {items.map((item) => (
        <MarginaliaSlot key={item.key} top={item.top}>
          {item.node}
        </MarginaliaSlot>
      ))}
    </aside>
  );
}

interface MarginaliaSlotProps {
  top: number;
  children: ReactNode;
}

function MarginaliaSlot({ top, children }: MarginaliaSlotProps) {
  // Dynamic top is computed from the live position of in-body markers, so it
  // cannot be expressed in StyleX (compile-time) and falls back to inline.
  const style = useMemo(() => ({ top: `${top}px` }), [top]);
  return (
    <div {...stylex.props(styles.item)} style={style}>
      {children}
    </div>
  );
}

function collectPending(
  content: HTMLElement,
  footnotes: readonly FootnoteEntry[],
  callouts: readonly CalloutEntry[],
  side: MarginaliaSide,
): PendingItem[] {
  const containerTop = content.getBoundingClientRect().top;
  const pending: PendingItem[] = [];
  let order = 0;

  for (const fn of footnotes) {
    const target = findFootnoteRef(content, fn.id);
    if (!target) continue;
    const itemSide = pickSide(order);
    order += 1;
    if (itemSide !== side) continue;
    const rect = target.getBoundingClientRect();
    pending.push({
      key: `fn-${fn.id}`,
      side: itemSide,
      measure: {
        id: `fn-${fn.id}`,
        top: rect.top - containerTop,
        height: rect.height,
      },
      node: <MarginaliaFootnote index={Number(fn.label) || order} footnote={fn} />,
    });
  }

  for (const callout of callouts) {
    const target = content.querySelector<HTMLElement>(`#${cssEscape(callout.id)}`);
    if (!target) continue;
    const itemSide = pickSide(order);
    order += 1;
    if (itemSide !== side) continue;
    const rect = target.getBoundingClientRect();
    pending.push({
      key: callout.id,
      side: itemSide,
      measure: {
        id: callout.id,
        top: rect.top - containerTop,
        height: rect.height,
      },
      node: <MarginaliaCallout callout={callout} />,
    });
  }

  return pending;
}

function findFootnoteRef(content: HTMLElement, id: string): HTMLElement | null {
  const escaped = cssEscape(id);
  const byHref = content.querySelector<HTMLElement>(
    `a[data-footnote-ref][href="#user-content-fn-${escaped}"]`,
  );
  if (byHref) return byHref;
  const byId = content.querySelector<HTMLElement>(`#user-content-fnref-${escaped}`);
  return byId;
}

function pickSide(index: number): MarginaliaSide {
  return index % 2 === 0 ? "right" : "left";
}

function cssEscape(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replaceAll(/[^a-zA-Z0-9_-]/gu, "\\$&");
}
