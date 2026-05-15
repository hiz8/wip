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
  top: number;
  node: ReactNode;
}

interface MarginaliaSource {
  key: string;
  measureId: string;
  findTarget: (content: HTMLElement) => HTMLElement | null;
  buildNode: (displayIndex: number) => ReactNode;
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
      const next = collectItems(content, footnotes, callouts, side);
      setItems((prev) => (sameItems(prev, next) ? prev : next));
    };

    const schedule = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(recompute);
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    ro.observe(content);

    const mo = new MutationObserver(schedule);
    mo.observe(content, { childList: true, subtree: true });

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
  // useMemo keeps the style object stable for the project's react-perf lint rule.
  const style = useMemo(() => ({ top: `${top}px` }), [top]);
  return (
    <div {...stylex.props(styles.item)} style={style}>
      {children}
    </div>
  );
}

function collectItems(
  content: HTMLElement,
  footnotes: readonly FootnoteEntry[],
  callouts: readonly CalloutEntry[],
  side: MarginaliaSide,
): ResolvedMarginaliaItem[] {
  const sources = buildSources(footnotes, callouts);
  const containerTop = content.getBoundingClientRect().top;
  const measurements: { id: string; top: number; height: number }[] = [];
  const sideItems: { key: string; measureId: string; node: ReactNode }[] = [];
  let visibleIndex = 0;

  for (const src of sources) {
    const target = src.findTarget(content);
    if (!target) continue;
    const rect = target.getBoundingClientRect();
    measurements.push({ id: src.measureId, top: rect.top - containerTop, height: rect.height });
    const order = visibleIndex;
    visibleIndex += 1;
    if (pickSide(order) !== side) continue;
    sideItems.push({ key: src.key, measureId: src.measureId, node: src.buildNode(order + 1) });
  }

  const placements = computeMarginaliaPlacements(measurements);
  const placementById = new Map(placements.map((p) => [p.id, p.top]));
  const resolved: ResolvedMarginaliaItem[] = [];
  for (const item of sideItems) {
    const top = placementById.get(item.measureId);
    if (top === undefined) continue;
    resolved.push({ key: item.key, top, node: item.node });
  }
  return resolved;
}

function buildSources(
  footnotes: readonly FootnoteEntry[],
  callouts: readonly CalloutEntry[],
): MarginaliaSource[] {
  const sources: MarginaliaSource[] = [];

  for (const fn of footnotes) {
    const labelNumber = Number.parseInt(fn.label, 10);
    sources.push({
      key: `fn-${fn.id}`,
      measureId: `fn-${fn.id}`,
      findTarget: (content) => findFootnoteRef(content, fn.id),
      buildNode: (displayIndex) => (
        <MarginaliaFootnote
          index={Number.isFinite(labelNumber) ? labelNumber : displayIndex}
          footnote={fn}
        />
      ),
    });
  }

  for (const callout of callouts) {
    sources.push({
      key: callout.id,
      measureId: callout.id,
      findTarget: (content) => content.querySelector<HTMLElement>(`#${cssEscape(callout.id)}`),
      buildNode: () => <MarginaliaCallout callout={callout} />,
    });
  }

  return sources;
}

function sameItems(a: readonly ResolvedMarginaliaItem[], b: readonly ResolvedMarginaliaItem[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]?.key !== b[i]?.key || a[i]?.top !== b[i]?.top) return false;
  }
  return true;
}

function findFootnoteRef(content: HTMLElement, id: string): HTMLElement | null {
  const escaped = cssEscape(id);
  const byHref = content.querySelector<HTMLElement>(
    `a[data-footnote-ref][href="#user-content-fn-${escaped}"]`,
  );
  if (byHref) return byHref;
  return content.querySelector<HTMLElement>(`#user-content-fnref-${escaped}`);
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
