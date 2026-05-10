import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { DetailLayout } from "@/components/layout/DetailLayout.tsx";
import { RightSidebar } from "@/components/layout/RightSidebar.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { BookHeader } from "@/components/content/BookHeader.tsx";
import { getBookDetailData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { SITE_DESCRIPTION } from "@/lib/config/static.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: space.s1,
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s4,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s2,
    marginTop: space.s2,
    listStyle: "none",
    padding: 0,
  },
  tag: {
    display: "inline-block",
    paddingInline: space.s2,
    paddingBlock: space.s1,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
  },
  content: {
    color: colors.textPrimary,
  },
});

export const Route = createFileRoute("/books/$isbn")({
  loader: async ({ params }) => {
    const book = await getBookDetailData({ data: { isbn: params.isbn } });
    if (!book) {
      throw notFound();
    }
    return book;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: makeTitle(loaderData?.title ?? null) },
      {
        name: "description",
        content: loaderData?.summary ?? SITE_DESCRIPTION,
      },
    ],
  }),
  component: BookDetail,
});

function BookDetail() {
  const book = Route.useLoaderData();
  const tree = useLoaderData({ from: "/books" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={book.slug} treeKind="books" />,
    [tree, book.slug],
  );
  const rightSidebar = useMemo(
    () => <RightSidebar toc={book.toc} backlinks={book.incomingLinks} />,
    [book.toc, book.incomingLinks],
  );
  const contentHtml = useMemo(() => ({ __html: book.html }), [book.html]);

  return (
    <AppShell variant="detail" treeSidebar={treeSidebar} rightSidebar={rightSidebar}>
      <DetailLayout>
        <Link to="/books" {...stylex.props(styles.back)}>
          ← Books
        </Link>
        <BookHeader
          title={book.title}
          authors={book.authors}
          isbn={book.isbn}
          pubYear={book.pubYear}
          publisher={book.publisher}
          readDate={book.readDate}
        />
        {book.tags.length > 0 && (
          <ul {...stylex.props(styles.tags)} role="list">
            {book.tags.map((tag) => (
              <li key={tag} {...stylex.props(styles.tag)}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div {...stylex.props(styles.content)} dangerouslySetInnerHTML={contentHtml} />
      </DetailLayout>
    </AppShell>
  );
}
