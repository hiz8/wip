import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { TagIndexList } from "@/components/common/TagIndexList.tsx";
import { getBooksTagsData } from "@/server/loaders.ts";
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
  empty: {
    color: colors.textMuted,
  },
});

export const Route = createFileRoute("/books/tags/")({
  loader: () => getBooksTagsData(),
  head: () => ({
    meta: [
      { title: makeTitle("Books Tags") },
      { name: "description", content: "Tags used across published Books." },
    ],
  }),
  component: BooksTagsIndex,
});

function BooksTagsIndex() {
  const tags = Route.useLoaderData();
  const tree = useLoaderData({ from: "/books" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="books" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <Link to="/books" {...stylex.props(styles.back)}>
        ← Books
      </Link>
      <h1 {...stylex.props(styles.heading)}>Books Tags</h1>
      {tags.length === 0 ? (
        <p {...stylex.props(styles.empty)}>No tags yet.</p>
      ) : (
        <TagIndexList type="books" tags={tags} />
      )}
    </AppShell>
  );
}
