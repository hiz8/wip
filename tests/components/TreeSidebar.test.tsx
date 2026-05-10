// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { buildTree } from "@/lib/tree/buildTree.ts";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";

const sampleTree = buildTree([
  { slug: "intro", title: "Intro Note", filePath: "intro.md" },
  { slug: "react", title: "React Hooks", filePath: "frontend/react.md" },
  { slug: "vue", title: "Vue Patterns", filePath: "frontend/vue.md" },
]);

function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const slugRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/notes/$slug",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, slugRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("TreeSidebar", () => {
  it("renders nested folder hierarchy", async () => {
    renderWithRouter(<TreeSidebar tree={sampleTree} activeSlug={null} />);
    await waitFor(() => expect(screen.getByText("Intro Note")).toBeInTheDocument());
    expect(screen.getByText("frontend")).toBeInTheDocument();
  });

  it("expands ancestors of the active note", async () => {
    renderWithRouter(<TreeSidebar tree={sampleTree} activeSlug="react" />);
    await waitFor(() => expect(screen.getByText("React Hooks")).toBeInTheDocument());
  });

  it("filters notes by the search input value", async () => {
    const user = userEvent.setup();
    renderWithRouter(<TreeSidebar tree={sampleTree} activeSlug={null} />);
    await waitFor(() => expect(screen.getByText("Intro Note")).toBeInTheDocument());
    const input = screen.getByRole("textbox", { name: /filter/i });
    await user.type(input, "intro");
    expect(screen.getByText("Intro Note")).toBeInTheDocument();
    expect(screen.queryByText("React Hooks")).not.toBeInTheDocument();
    expect(screen.queryByText("Vue Patterns")).not.toBeInTheDocument();
  });

  it("clears the filter via the clear button", async () => {
    const user = userEvent.setup();
    renderWithRouter(<TreeSidebar tree={sampleTree} activeSlug={null} />);
    await waitFor(() => expect(screen.getByText("Intro Note")).toBeInTheDocument());
    const input = screen.getByRole("textbox", { name: /filter/i }) as HTMLInputElement;
    await user.type(input, "intro");
    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(input.value).toBe("");
  });
});
