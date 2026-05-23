import { useEffect, useState } from "react";

interface UseTocActiveOptions {
  rootMargin?: string;
}

const DEFAULT_ROOT_MARGIN = "0px 0px 0px 0px";
const EMPTY_SET: ReadonlySet<string> = new Set();

// Track which heading ids are currently "active" based on viewport
// intersection. Every TOC anchor whose associated section is visible gets a
// truthy entry in the returned Set, so multiple anchors can be highlighted
// simultaneously while the reader scrolls — mirroring MDN's TOC behavior.
//
// Each TOC id is mapped to one or more `<section data-heading-id="…">`
// elements (produced by `rehypeSectionize`). Sections without a matching TOC
// id are absorbed by the preceding known TOC id (reverse-scan), so any extra
// content stays attached to its nearest heading.
export function useTocActive(
  headingIds: readonly string[],
  options: UseTocActiveOptions = {},
): ReadonlySet<string> {
  const [activeIds, setActiveIds] = useState<ReadonlySet<string>>(EMPTY_SET);
  // Join into a single key so callers passing a freshly-mapped array each
  // render do not retrigger the effect when ids are unchanged.
  const idsKey = headingIds.join("\n");
  const rootMargin = options.rootMargin ?? DEFAULT_ROOT_MARGIN;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    const ids = idsKey === "" ? [] : idsKey.split("\n");
    if (ids.length === 0) {
      setActiveIds(EMPTY_SET);
      return;
    }
    const knownIds = new Set(ids);

    const allSections = Array.from(document.querySelectorAll<HTMLElement>("[data-heading-id]"));
    if (allSections.length === 0) {
      setActiveIds(EMPTY_SET);
      return;
    }

    // Reverse-scan to absorb non-TOC sections into the preceding known id.
    const sectionToTocId = new Map<HTMLElement, string>();
    const groupByTocId = new Map<string, HTMLElement[]>();
    let currentTocId: string | null = null;
    for (let i = allSections.length - 1; i >= 0; i--) {
      const section = allSections[i]!;
      const id = section.dataset["headingId"];
      if (id && knownIds.has(id)) currentTocId = id;
      if (!currentTocId) continue;
      sectionToTocId.set(section, currentTocId);
      const group = groupByTocId.get(currentTocId);
      if (group) group.push(section);
      else groupByTocId.set(currentTocId, [section]);
    }

    if (groupByTocId.size === 0) {
      setActiveIds(EMPTY_SET);
      return;
    }

    const visibleSections = new Set<HTMLElement>();
    const everVisible = new Set<HTMLElement>();
    const currentActive = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        let changed = false;
        for (const entry of entries) {
          const target = entry.target;
          if (!(target instanceof HTMLElement)) continue;
          const tocId = sectionToTocId.get(target);
          if (!tocId) continue;

          // Filter out the initial spurious "not intersecting" callback that
          // fires for every observed element on the first IO tick.
          if (!everVisible.has(target)) {
            if (entry.isIntersecting) everVisible.add(target);
            else continue;
          }

          if (entry.isIntersecting) visibleSections.add(target);
          else visibleSections.delete(target);

          const group = groupByTocId.get(tocId)!;
          const nowActive = group.some((s) => visibleSections.has(s));
          const wasActive = currentActive.has(tocId);
          if (nowActive && !wasActive) {
            currentActive.add(tocId);
            changed = true;
          } else if (!nowActive && wasActive) {
            currentActive.delete(tocId);
            changed = true;
          }
        }
        if (changed) setActiveIds(new Set(currentActive));
      },
      { rootMargin, threshold: 0 },
    );

    for (const section of sectionToTocId.keys()) observer.observe(section);

    return () => observer.disconnect();
  }, [idsKey, rootMargin]);

  return activeIds;
}
