import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { BookCard } from "@/components/card/BookCard.tsx";
import { getBooksByTagData } from "@/server/loaders.ts";
import { decodeTagSlug } from "@/lib/tags/index.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

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

export const Route = createFileRoute("/books/tags/$tag")({
  loader: ({ params }) => getBooksByTagData({ data: { tag: params.tag } }),
  head: ({ params }) => {
    const tag = decodeTagSlug(params.tag);
    return {
      meta: [
        { title: makeTitle(`Books tagged "${tag}"`) },
        { name: "description", content: `Books tagged with "${tag}".` },
      ],
    };
  },
  component: BooksByTag,
});

function BooksByTag() {
  const books = Route.useLoaderData();
  const { tag } = Route.useParams();
  const decodedTag = decodeTagSlug(tag);
  const tree = useLoaderData({ from: "/books" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="books" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <Link to="/books/tags" {...stylex.props(styles.back)}>
        ← Books Tags
      </Link>
      <h1 {...stylex.props(styles.heading)}>#{decodedTag}</h1>
      {books.length === 0 ? (
        <p {...stylex.props(styles.empty)}>No books with this tag.</p>
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
                coverUrl={book.coverUrl}
              />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
