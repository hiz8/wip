import { Outlet, createFileRoute } from "@tanstack/react-router";
import { getBooksTreeData } from "@/server/loaders.ts";

export const Route = createFileRoute("/books")({
  loader: () => getBooksTreeData(),
  component: BooksLayout,
});

function BooksLayout() {
  return <Outlet />;
}
