import { Link, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <main>
      <h1>Digital Garden</h1>
      <p>
        <Link to="/notes">Browse notes</Link>
      </p>
    </main>
  );
}
