import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { getNoteBySlug } from "@/server/notes.ts";

export const Route = createFileRoute("/notes/$slug")({
  loader: async ({ params }) => {
    const note = await getNoteBySlug(params.slug);
    if (!note) {
      throw notFound();
    }
    return {
      slug: note.slug,
      title: note.title,
      created: note.frontmatter.created,
      updated: note.frontmatter.updated,
      tags: note.frontmatter.tags ?? [],
      html: note.html,
    };
  },
  component: NoteDetail,
});

function NoteDetail() {
  const note = Route.useLoaderData();

  return (
    <main>
      <p>
        <Link to="/notes">← Notes</Link>
      </p>
      <article>
        <header>
          <h1>{note.title}</h1>
          <p>
            Created <time dateTime={note.created}>{note.created.slice(0, 10)}</time>
            {" / Updated "}
            <time dateTime={note.updated}>{note.updated.slice(0, 10)}</time>
          </p>
          {note.tags.length > 0 && (
            <ul>
              {note.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          )}
        </header>
        <div
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: note.html }}
        />
      </article>
    </main>
  );
}
