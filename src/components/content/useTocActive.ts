import { useEffect, useState } from "react";

interface UseTocActiveOptions {
  rootMargin?: string;
}

const DEFAULT_ROOT_MARGIN = "0px 0px 0px 0px";
const EMPTY_SET: ReadonlySet<string> = new Set();

// viewport との交差に基づき、どの heading id が現在「active」かを追跡する。
// 関連する section が可視である TOC anchor は返り値の Set に truthy な entry を
// 持つため、読者がスクロールする間に複数の anchor を同時にハイライトできる —
// MDN の TOC 挙動をミラーしている。
//
// 各 TOC id は (`rehypeSectionize` が生成する) 1 つ以上の
// `<section data-heading-id="…">` 要素にマップされる。一致する TOC id を持たない
// section は直前の既知 TOC id に吸収される (reverse-scan) ため、余分なコンテンツも
// 最も近い見出しに紐づいたままになる。
export function useTocActive(
  headingIds: readonly string[],
  options: UseTocActiveOptions = {},
): ReadonlySet<string> {
  const [activeIds, setActiveIds] = useState<ReadonlySet<string>>(EMPTY_SET);
  // 単一のキーに join することで、render ごとに新しく map した配列を渡す
  // 呼び出し元でも、ids が不変なら effect を再トリガーしない。
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

    // reverse-scan で、TOC にない section を直前の既知 id に吸収する。
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

          // 最初の IO tick で監視対象の全要素に対して発火する、初回の偽の
          // 「not intersecting」コールバックをフィルタする。
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
