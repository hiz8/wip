import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { BookTile } from "@/components/card/BookTile.tsx";
import { IndexPageHeader } from "@/components/common/IndexPageHeader.tsx";
import { getBooksIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  wrap: {
    maxWidth: "1100px",
  },
  tagsLink: {
    display: "inline-block",
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
    rowGap: space.s6,
    columnGap: space.s5,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  empty: {
    color: colors.textMuted,
  },
});

export const Route = createFileRoute("/books/")({
  loader: () => getBooksIndexData(),
  head: () => ({
    meta: [
      { title: makeTitle("Books") },
      { name: "description", content: "Books — published reading notes." },
    ],
  }),
  component: BooksIndex,
});

function BooksIndex() {
  const books = Route.useLoaderData();
  const tree = useLoaderData({ from: "/books" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="books" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <div {...stylex.props(styles.wrap)}>
        <IndexPageHeader
          crumbRoot="Books"
          crumbCurrent="一覧"
          title="読んだ本"
          sub="手を動かしながら読んだ本だけ。Notes から参照されることが多い。"
        />
        <Link to="/books/tags" {...stylex.props(styles.tagsLink)}>
          Browse tags →
        </Link>

        {books.length === 0 ? (
          <p {...stylex.props(styles.empty)}>No published books yet.</p>
        ) : (
          // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示
          <ul {...stylex.props(styles.grid)} role="list">
            {books.map((book) => (
              <li key={book.slug}>
                <BookTile
                  slug={book.slug}
                  title={book.title}
                  authors={book.authors}
                  readDate={book.readDate}
                  coverUrl={book.coverUrl}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
