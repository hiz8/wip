import { Outlet, createFileRoute } from "@tanstack/react-router";
import { getNotesTreeData } from "@/server/loaders.ts";

export const Route = createFileRoute("/notes")({
  loader: () => getNotesTreeData(),
  component: NotesLayout,
});

function NotesLayout() {
  return <Outlet />;
}
