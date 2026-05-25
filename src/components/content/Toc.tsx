import * as stylex from "@stylexjs/stylex";
import { useEffect, useMemo, useRef } from "react";
import type { TocEntry } from "@/types/content.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { useTocActive } from "./useTocActive.ts";

interface TocProps {
  entries: readonly TocEntry[];
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const styles = stylex.create({
  nav: {
    position: "sticky",
    top: space.s5,
    maxHeight: `calc(100vh - ${space.s7})`,
    overflowY: "auto",
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
    minHeight: "2.75rem",
    paddingBlock: space.s1,
    paddingInline: space.s2,
    marginInlineStart: `calc((${space.s3} + 2px) * -1)`,
    borderInlineStartWidth: "2px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: "transparent",
    color: colors.textSecondary,
    textDecoration: { default: "none", ":hover": "underline" },
    lineHeight: typography.lineHeightTight,
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function Toc({ entries }: TocProps) {
  const activeIds = useTocActive(entries.map((entry) => entry.id));
  const navRef = useRef<HTMLElement>(null);

  const topActiveId = useMemo(
    () => entries.find((entry) => activeIds.has(entry.id))?.id,
    [entries, activeIds],
  );

  useEffect(() => {
    if (!topActiveId) return;
    const link = navRef.current?.querySelector<HTMLAnchorElement>(
      `[data-toc-id="${CSS.escape(topActiveId)}"]`,
    );
    if (!link || typeof link.scrollIntoView !== "function") return;
    link.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "nearest",
    });
  }, [topActiveId]);

  // Delegate clicks at the nav level instead of attaching per-anchor handlers.
  // Bound imperatively because anchors handle keyboard activation natively;
  // a JSX onClick on the container would trigger the jsx-a11y rule that
  // expects a paired key handler.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
        return;
      }
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[data-toc-id]");
      if (!anchor || !nav.contains(anchor)) return;
      const id = anchor.dataset["tocId"];
      if (!id) return;
      const heading = document.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!heading) return;
      event.preventDefault();
      history.replaceState(null, "", `#${id}`);
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "start",
      });
    };
    nav.addEventListener("click", onClick);
    return () => nav.removeEventListener("click", onClick);
  }, []);

  if (entries.length < 2) return null;

  return (
    <nav ref={navRef} {...stylex.props(styles.nav)} aria-label="目次">
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
