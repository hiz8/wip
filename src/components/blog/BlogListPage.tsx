import { Fragment, useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { DetailLayout } from "@/components/layout/DetailLayout.tsx";
import type { BlogListPageDto } from "@/server/loaders.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { BlogArticleBlock } from "./BlogArticleBlock.tsx";
import { BlogBreadcrumb } from "./BlogBreadcrumb.tsx";

const styles = stylex.create({
  title: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.weightSemibold,
    marginBottom: space.s6,
    overflowWrap: "anywhere",
  },
  divider: {
    // 前の記事の Marginalia を跨がない
    clear: "both",
    borderWidth: 0,
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: colors.borderSubtle,
    marginBlock: space.s6,
  },
  pager: {
    clear: "both",
    display: "flex",
    justifyContent: "space-between",
    marginTop: space.s7,
    fontSize: typography.fontSizeSm,
  },
  pagerLink: {
    color: colors.link,
    textDecoration: { default: "none", ":hover": "underline" },
  },
});

interface BlogListPageProps {
  data: BlogListPageDto;
}

export function BlogListPage({ data }: BlogListPageProps) {
  const hasMarginalia = data.articles.some(
    (a) => a.footnotes.length > 0 || a.html.includes("data-callout"),
  );
  const prev = data.page - 1;
  const next = data.page + 1;
  return (
    <DetailLayout hasMarginalia={hasMarginalia}>
      <BlogBreadcrumb items={data.breadcrumb} />
      {data.pageTitle && <h1 {...stylex.props(styles.title)}>{data.pageTitle}</h1>}
      {data.articles.map((article, i) => (
        <Fragment key={article.slug}>
          {i > 0 && <hr {...stylex.props(styles.divider)} />}
          <BlogArticleBlock article={article} />
        </Fragment>
      ))}
      {(prev >= 1 || next <= data.totalPages) && (
        <nav aria-label="Pagination" {...stylex.props(styles.pager)}>
          <span>{prev >= 1 && <PagerLink tagset={data.tagset} page={prev} label="← 前へ" />}</span>
          <span>
            {next <= data.totalPages && (
              <PagerLink tagset={data.tagset} page={next} label="次へ →" />
            )}
          </span>
        </nav>
      )}
    </DetailLayout>
  );
}

// 1 ページ目は常に base URL (/page/1 は生成しない)。tagset の有無・ページ番号で
// 遷移先ルートの shape が変わり `Link` の型が条件分岐に対応しないため、
// コンポーネントごと分岐する。
function PagerLink({
  tagset,
  page,
  label,
}: {
  tagset: string | null;
  page: number;
  label: string;
}) {
  if (tagset === null) {
    return <TopPagerLink page={page} label={label} />;
  }
  return <TagsetPagerLink tagset={tagset} page={page} label={label} />;
}

function TopPagerLink({ page, label }: { page: number; label: string }) {
  const params = useMemo(() => ({ n: String(page) }), [page]);
  return page === 1 ? (
    <Link to="/blog" {...stylex.props(styles.pagerLink)}>
      {label}
    </Link>
  ) : (
    <Link to="/blog/page/$n" params={params} {...stylex.props(styles.pagerLink)}>
      {label}
    </Link>
  );
}

function TagsetPagerLink({ tagset, page, label }: { tagset: string; page: number; label: string }) {
  const tagsetParams = useMemo(() => ({ tagset }), [tagset]);
  const pageParams = useMemo(() => ({ tagset, n: String(page) }), [tagset, page]);
  return page === 1 ? (
    <Link to="/blog/tags/$tagset" params={tagsetParams} {...stylex.props(styles.pagerLink)}>
      {label}
    </Link>
  ) : (
    <Link to="/blog/tags/$tagset/page/$n" params={pageParams} {...stylex.props(styles.pagerLink)}>
      {label}
    </Link>
  );
}
