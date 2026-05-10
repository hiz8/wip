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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (headingIds.length === 0) {
      setActiveId(null);
      return;
    }
    if (typeof IntersectionObserver === "undefined") return;

    const elements: HTMLElement[] = [];
    for (const id of headingIds) {
      const el = document.getElementById(id);
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
      { rootMargin: options.rootMargin ?? DEFAULT_ROOT_MARGIN, threshold: 0 },
    );

    for (const el of elements) observer.observe(el);

    return () => observer.disconnect();
  }, [headingIds, options.rootMargin]);

  return activeId;
}
