import * as stylex from "@stylexjs/stylex";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { NoteCard } from "@/components/card/NoteCard.tsx";
import { getNotesIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  heading: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.weightSemibold,
    marginBottom: space.s5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: space.s4,
  },
});

export const Route = createFileRoute("/notes/")({
  loader: () => getNotesIndexData(),
  head: () => ({
    meta: [
      { title: makeTitle("Notes") },
      { name: "description", content: "Notes — published entries from the Vault." },
    ],
  }),
  component: NotesIndex,
});

function NotesIndex() {
  const notes = Route.useLoaderData();
  const tree = useLoaderData({ from: "/notes" });

  return (
    <AppShell variant="list" treeSidebar={<TreeSidebar tree={tree} activeSlug={null} />}>
      <h1 {...stylex.props(styles.heading)}>Notes</h1>
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
    </AppShell>
  );
}
