import { useEffect, useState } from "react";

interface UseTocActiveOptions {
  rootMargin?: string;
}

const DEFAULT_ROOT_MARGIN = "0px 0px -75% 0px";

// Track which heading id is currently considered "active" based on viewport
// intersection. When multiple headings intersect simultaneously we pick the
// last (deepest) one so anchors update naturally as the reader scrolls.
export function useTocActive(
  headingIds: readonly string[],
  options: UseTocActiveOptions = {},
): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  // Join into a single key so callers passing a freshly-mapped array each
  // render do not retrigger the effect when ids are unchanged.
  const idsKey = headingIds.join("\n");
  const rootMargin = options.rootMargin ?? DEFAULT_ROOT_MARGIN;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    const ids = idsKey === "" ? [] : idsKey.split("\n");
    if (ids.length === 0) {
      setActiveId(null);
      return;
    }

    const elements: HTMLElement[] = [];
    for (const id of ids) {
      const el = document.querySelector<HTMLElement>(`#${escapeIdSelector(id)}`);
      if (el) elements.push(el);
    }
    if (elements.length === 0) {
      setActiveId(null);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .toSorted((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length === 0) return;
        const last = visible.at(-1);
        if (!last) return;
        setActiveId(last.target.id || null);
      },
      { rootMargin, threshold: 0 },
    );

    for (const el of elements) observer.observe(el);

    return () => observer.disconnect();
  }, [idsKey, rootMargin]);

  return activeId;
}

function escapeIdSelector(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replaceAll(/[^a-zA-Z0-9_-]/gu, "\\$&");
}
