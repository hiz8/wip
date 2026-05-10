import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { BookCard } from "@/components/card/BookCard.tsx";
import { getBooksIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  heading: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.weightSemibold,
    marginBottom: space.s5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: space.s4,
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
      <h1 {...stylex.props(styles.heading)}>Books</h1>
      {books.length === 0 ? (
        <p {...stylex.props(styles.empty)}>No published books yet.</p>
      ) : (
        <ul {...stylex.props(styles.grid)} role="list">
          {books.map((book) => (
            <li key={book.slug}>
              <BookCard
                slug={book.slug}
                title={book.title}
                authors={book.authors}
                pubYear={book.pubYear}
                summary={book.summary}
                tags={book.tags}
              />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
