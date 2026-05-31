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
    // reset.css は <html> に `scroll-behavior: smooth` を設定しているが、TOC の
    // 自己スクロールは <nav> 内で起きるため、このプロパティはここにも必要。
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
    // デザイン同様、現在地はテキストを primary に保ち、accent は左ボーダーのみに使う。
    color: colors.textPrimary,
    backgroundColor: colors.selectedBg,
    borderInlineStartColor: colors.accent,
    borderTopRightRadius: "4px",
    borderBottomRightRadius: "4px",
  },
});

export function Toc({ entries }: TocProps) {
  const activeIds = useTocActive(entries.map((entry) => entry.id));
  const navRef = useRef<HTMLElement>(null);

  const topActiveId = useMemo(() => {
    // 親 h2 よりも最初の active な h3 を優先する。`rehypeSectionize` は各 h3
    // section を親 h2 section の内側にネストするため、h2 はその h3 子要素の
    // 範囲全体にわたって `activeIds` に残り続ける。entries の順序で厳密に選ぶと、
    // 読者が h3 サブセクションの奥深くまで進んだ後でも sync-scroll が h2 に
    // 取り残され、nav の可視領域より下にある後続の h3 リンクを隠してしまう。
    // 最初の active な entry にフォールバックすることで、h3 が関与しない兄弟 h2
    // 間の遷移についてはガイドが定める「最上位の active」挙動を保つ。
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
    // document ではなく nav だけをスクロールする。scrollIntoView はすべての祖先
    // スクロールコンテナをたどるため、sticky な nav が一時的に画面外へ逸れている
    // とき nav を引き戻そうとして <html> を巻き戻してしまう — 読者にはページが
    // 先頭へ引っ張られたように見える。
    const linkRect = link.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    let delta = 0;
    if (linkRect.top < navRect.top) delta = linkRect.top - navRect.top;
    else if (linkRect.bottom > navRect.bottom) delta = linkRect.bottom - navRect.bottom;
    if (delta !== 0 && typeof nav.scrollBy === "function") nav.scrollBy({ top: delta });
  }, [topActiveId]);

  // anchor ごとに handler を付けるのではなく、nav レベルで click を委譲する。
  // <nav> が mount した瞬間に listener が付くよう、コールバック ref を介して
  // 配線する。`[]` deps の `useEffect` では、最初の render が null を返し
  // (例: entries.length < 2) 後の render で <nav> が mount するケースを取り逃す:
  // 空 deps の effect は初回 commit 後 (navRef.current がまだ null のとき) に
  // 一度だけ走り、再実行されない。
  //
  // React 19 は unmount 時に ref を null で再呼び出しせず、返した cleanup を
  // 呼ぶため、すべての setup を mount 分岐に置き、listener の detach と navRef の
  // 解放は cleanup の一箇所にまとめている。
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
