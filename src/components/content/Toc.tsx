import * as stylex from "@stylexjs/stylex";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { TocEntry } from "@/types/content.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { useTocActive } from "./useTocActive.ts";

interface TocProps {
  entries: readonly TocEntry[];
}

const styles = stylex.create({
  nav: {
    position: "sticky",
    top: space.s5,
    maxHeight: `calc(100vh - ${space.s7})`,
    overflowY: "auto",
    // reset.css sets `scroll-behavior: smooth` on <html>, but TOC self-scroll
    // happens inside <nav>, so the property is also needed here.
    scrollBehavior: "smooth",
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: colors.borderSubtle,
    paddingInlineStart: space.s3,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  link: {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: 2,
    overflow: "hidden",
    boxSizing: "border-box",
    paddingBlock: space.s1,
    paddingInline: space.s2,
    marginInlineStart: `calc((${space.s3} + 2px) * -1)`,
    borderInlineStartWidth: "2px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: "transparent",
    color: colors.textSecondary,
    textDecoration: { default: "none", ":hover": "underline" },
  },
  linkH2: {
    fontSize: "0.8125rem",
    fontWeight: typography.weightMedium,
  },
  linkH3: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightRegular,
    paddingInlineStart: space.s4,
  },
  linkActive: {
    color: colors.accent,
    backgroundColor: colors.bgElevated,
    borderInlineStartColor: colors.accent,
  },
});

export function Toc({ entries }: TocProps) {
  const activeIds = useTocActive(entries.map((entry) => entry.id));
  const navRef = useRef<HTMLElement>(null);

  const topActiveId = useMemo(() => {
    // Prefer the first active h3 over the parent h2. `rehypeSectionize` nests
    // each h3 section inside its parent h2 section, so the h2 stays in
    // `activeIds` for the entire span of its h3 children. Picking strictly
    // by entries order would strand sync-scroll on the h2 even after the
    // reader has progressed deep into the h3 subsections, hiding later h3
    // links below the nav's visible area. Falling back to the first active
    // entry preserves the guide-mandated "topmost active" behavior for
    // sibling h2 transitions where no h3 is involved.
    let firstActive: string | undefined;
    for (const entry of entries) {
      if (!activeIds.has(entry.id)) continue;
      if (entry.depth === 3) return entry.id;
      if (firstActive === undefined) firstActive = entry.id;
    }
    return firstActive;
  }, [entries, activeIds]);

  useEffect(() => {
    if (!topActiveId) return;
    const nav = navRef.current;
    if (!nav) return;
    const link = nav.querySelector<HTMLAnchorElement>(`[data-toc-id="${CSS.escape(topActiveId)}"]`);
    if (!link) return;
    // Scroll only the nav, not the document. scrollIntoView walks every
    // ancestor scroll container, so when the sticky nav has temporarily
    // drifted out of view it would rewind <html> to pull the nav back in —
    // which the reader perceives as the page being yanked to the top.
    const linkRect = link.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    let delta = 0;
    if (linkRect.top < navRect.top) delta = linkRect.top - navRect.top;
    else if (linkRect.bottom > navRect.bottom) delta = linkRect.bottom - navRect.bottom;
    if (delta !== 0 && typeof nav.scrollBy === "function") nav.scrollBy({ top: delta });
  }, [topActiveId]);

  // Delegate clicks at the nav level instead of attaching per-anchor handlers.
  // Wired through a callback ref so the listener attaches exactly when the
  // <nav> mounts. A `useEffect` with `[]` deps would miss the case where the
  // first render returns null (e.g., entries.length < 2) and a later render
  // mounts the <nav>: the empty-deps effect runs only after the initial
  // commit, when navRef.current is still null, and never re-runs.
  //
  // React 19 invokes the returned cleanup on unmount instead of re-calling
  // the ref with null, so all setup lives in the mounted branch and the
  // cleanup is the single place where the listener detaches and navRef is
  // released.
  const handleNavRef = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    navRef.current = node;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[data-toc-id]");
      if (!anchor || !node.contains(anchor)) return;
      const id = anchor.dataset["tocId"];
      if (!id) return;
      const heading = document.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!heading) return;
      event.preventDefault();
      history.replaceState(null, "", `#${id}`);
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "start" });
    };
    node.addEventListener("click", onClick);
    return () => {
      node.removeEventListener("click", onClick);
      navRef.current = null;
    };
  }, []);

  if (entries.length < 2) return null;

  return (
    <nav ref={handleNavRef} {...stylex.props(styles.nav)} aria-label="目次">
      <ul {...stylex.props(styles.list)}>
        {entries.map((entry) => {
          const isActive = activeIds.has(entry.id);
          const depthStyle = entry.depth === 3 ? styles.linkH3 : styles.linkH2;
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                data-toc-id={entry.id}
                title={entry.text}
                aria-current={isActive ? "location" : undefined}
                {...stylex.props(styles.link, depthStyle, isActive && styles.linkActive)}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
