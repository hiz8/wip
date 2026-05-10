import { Outlet, createFileRoute } from "@tanstack/react-router";
import { getGlossaryTreeData } from "@/server/loaders.ts";

export const Route = createFileRoute("/glossary")({
  loader: () => getGlossaryTreeData(),
  component: GlossaryLayout,
});

function GlossaryLayout() {
  return <Outlet />;
}
