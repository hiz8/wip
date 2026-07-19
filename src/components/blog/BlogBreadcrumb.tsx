import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Breadcrumb, Breadcrumbs } from "react-aria-components";
import { Link } from "@tanstack/react-router";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";

const styles = stylex.create({
  nav: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    marginBottom: space.s4,
  },
  crumbs: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.s2,
    listStyle: "none",
    margin: 0,
    padding: 0,
    fontSize: typography.fontSizeSm,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
  },
  link: {
    color: colors.link,
    textDecoration: { default: "none", ":hover": "underline" },
  },
  current: {
    color: colors.textSecondary,
  },
  sep: {
    opacity: 0.5,
  },
});

export interface BlogCrumb {
  label: string;
  tagset: string;
}

interface BlogBreadcrumbProps {
  /** 累積正規チェーン。末尾要素が現在ページ。空配列 = トップ (/blog) */
  items: readonly BlogCrumb[];
}

function BlogCrumbLink({ tagset, label }: BlogCrumb) {
  const params = useMemo(() => ({ tagset }), [tagset]);
  return (
    <Link to="/blog/tags/$tagset" params={params} {...stylex.props(styles.link)}>
      {label}
    </Link>
  );
}

// Blog は可変長の累積正規チェーンを辿るため、固定 3 段の Breadcrumb (共通コンポーネント)
// ではなく専用実装を持つ。マークアップ・スタイルは既存 Breadcrumb.tsx に合わせる。
export function BlogBreadcrumb({ items }: BlogBreadcrumbProps) {
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumb" {...stylex.props(styles.nav)}>
      <TreeDrawerTrigger />
      <Breadcrumbs {...stylex.props(styles.crumbs)}>
        <Breadcrumb {...stylex.props(styles.item)}>
          {items.length === 0 ? (
            <span {...stylex.props(styles.current)} aria-current="page">
              Blog
            </span>
          ) : (
            <Link to="/blog" {...stylex.props(styles.link)}>
              Blog
            </Link>
          )}
        </Breadcrumb>
        {items.map((item, i) => (
          <Breadcrumb key={item.tagset} {...stylex.props(styles.item)}>
            <span {...stylex.props(styles.sep)} aria-hidden="true">
              /
            </span>
            {i === last ? (
              <span {...stylex.props(styles.current)} aria-current="page">
                {item.label}
              </span>
            ) : (
              <BlogCrumbLink tagset={item.tagset} label={item.label} />
            )}
          </Breadcrumb>
        ))}
      </Breadcrumbs>
    </nav>
  );
}
