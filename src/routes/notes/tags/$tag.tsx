import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { NoteCard } from "@/components/card/NoteCard.tsx";
import { getNotesByTagData } from "@/server/loaders.ts";
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
    gridTemplateColumns: "1fr",
    gap: space.s4,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  empty: {
    color: colors.textMuted,
  },
});

export const Route = createFileRoute("/notes/tags/$tag")({
  loader: ({ params }) => getNotesByTagData({ data: { tag: params.tag } }),
  head: ({ params }) => {
    const tag = decodeTagSlug(params.tag);
    return {
      meta: [
        { title: makeTitle(`Notes tagged "${tag}"`) },
        { name: "description", content: `Notes tagged with "${tag}".` },
      ],
    };
  },
  component: NotesByTag,
});

function NotesByTag() {
  const notes = Route.useLoaderData();
  const { tag } = Route.useParams();
  const decodedTag = decodeTagSlug(tag);
  const tree = useLoaderData({ from: "/notes" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="notes" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <Link to="/notes/tags" {...stylex.props(styles.back)}>
        ← Notes Tags
      </Link>
      <h1 {...stylex.props(styles.heading)}>#{decodedTag}</h1>
      {notes.length === 0 ? (
        <p {...stylex.props(styles.empty)}>No notes with this tag.</p>
      ) : (
        <ul {...stylex.props(styles.grid)} role="list">
          {notes.map((note) => (
            <li key={note.slug}>
              <NoteCard
                slug={note.slug}
                title={note.title}
                summary={note.summary}
                tags={note.tags}
                updated={note.updated}
              />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
