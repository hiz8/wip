import * as stylex from "@stylexjs/stylex";
import { Breadcrumb as AriaBreadcrumb, Breadcrumbs } from "react-aria-components";
import { Link } from "@tanstack/react-router";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";

export type CrumbRootTo = "/notes" | "/glossary" | "/books";

interface BreadcrumbProps {
  /** 先頭セグメントのラベル。rootTo を与えるとカテゴリトップへのリンクになる。 */
  rootLabel: string;
  rootTo?: CrumbRootTo;
  /** 中間セグメント (Notes のフォルダ名、Glossary のかな行など)。null は省略。 */
  middle?: string | null | undefined;
  current: string;
}

const styles = stylex.create({
  nav: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    marginBottom: space.s5,
  },
  crumbs: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.s2,
    listStyle: "none",
    margin: 0,
    padding: 0,
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
  },
  rootLink: {
    color: { default: colors.textMuted, ":hover": colors.link },
    textDecoration: { default: "none", ":hover": "underline" },
  },
  sep: {
    opacity: 0.5,
  },
  current: {
    color: colors.textPrimary,
  },
});

// パンくず (root / middle / current)。react-aria-components の Breadcrumbs が
// ol/li を描画する。リンクは型安全な params を保つため RAC Link ではなく
// TanStack の Link を子として合成する (ContentLink.tsx と同じ方針)。
export function Breadcrumb({ rootLabel, rootTo, middle, current }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくず" {...stylex.props(styles.nav)}>
      <TreeDrawerTrigger />
      <Breadcrumbs {...stylex.props(styles.crumbs)}>
        <AriaBreadcrumb {...stylex.props(styles.item)}>
          {rootTo === undefined ? (
            <span>{rootLabel}</span>
          ) : (
            <Link to={rootTo} {...stylex.props(styles.rootLink)}>
              {rootLabel}
            </Link>
          )}
          <span {...stylex.props(styles.sep)} aria-hidden="true">
            /
          </span>
        </AriaBreadcrumb>
        {middle !== undefined && middle !== null && (
          <AriaBreadcrumb {...stylex.props(styles.item)}>
            <span>{middle}</span>
            <span {...stylex.props(styles.sep)} aria-hidden="true">
              /
            </span>
          </AriaBreadcrumb>
        )}
        <AriaBreadcrumb {...stylex.props(styles.item)}>
          <span {...stylex.props(styles.current)} aria-current="page">
            {current}
          </span>
        </AriaBreadcrumb>
      </Breadcrumbs>
    </nav>
  );
}
