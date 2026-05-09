import { Link, createFileRoute } from "@tanstack/react-router";
import { getAllNotes } from "@/server/notes.ts";

export const Route = createFileRoute("/notes/")({
  loader: async () => {
    const notes = await getAllNotes();
    return notes.map((note) => ({
      slug: note.slug,
      title: note.title,
      updated: note.frontmatter.updated,
      summary: note.frontmatter.summary ?? null,
    }));
  },
  component: NotesIndex,
});

function NotesIndex() {
  const notes = Route.useLoaderData();

  return (
    <main>
      <h1>Notes</h1>
      <ul>
        {notes.map((note) => (
          <li key={note.slug}>
            <Link to="/notes/$slug" params={{ slug: note.slug }}>
              {note.title}
            </Link>
            {" — "}
            <time dateTime={note.updated}>{note.updated.slice(0, 10)}</time>
            {note.summary !== null && <p>{note.summary}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
