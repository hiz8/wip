// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
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
import { Backlinks } from "@/components/common/Backlinks.tsx";
import { Icon } from "@/components/common/Icon.tsx";
import type { BacklinkRef } from "@/types/content.ts";

const NO_LINKS: readonly BacklinkRef[] = [];

const ALL_LINKS: readonly BacklinkRef[] = [
  { type: "notes", slug: "note-a", title: "Note A", updated: "2025-01-01" },
  { type: "glossary", slug: "react-fiber", title: "React Fiber", updated: "2025-01-02" },
  { type: "books", slug: "9784873119045", title: "リファクタリング", updated: "2025-01-03" },
];

function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const make = (p: string) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: p,
      component: () => null,
    });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      make("/notes/$slug"),
      make("/glossary/$slug"),
      make("/books/$isbn"),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("Backlinks", () => {
  it("renders nothing when links is empty", () => {
    renderWithRouter(<Backlinks links={NO_LINKS} />);
    expect(screen.queryByText(/backlinks/iu)).not.toBeInTheDocument();
  });

  it("links Notes / Glossary / Books with the correct href", async () => {
    renderWithRouter(<Backlinks links={ALL_LINKS} />);
    await waitFor(() => expect(screen.getByText("Note A")).toBeInTheDocument());
    expect(document.querySelector('a[href="/notes/note-a"]')).not.toBeNull();
    expect(document.querySelector('a[href="/glossary/react-fiber"]')).not.toBeNull();
    expect(document.querySelector('a[href="/books/9784873119045"]')).not.toBeNull();
  });

  it("renders the matching content-type icon for each backlink", async () => {
    const { container } = renderWithRouter(<Backlinks links={ALL_LINKS} />);
    await waitFor(() => expect(screen.getByText("Note A")).toBeInTheDocument());
    // ContentTypeIcon は装飾的な Icon (span, aria-hidden ラッパー内) を行頭に 1 つ描画する。
    const iconClasses = Array.from(container.querySelectorAll("li")).map(
      (li) => li.querySelector("span > span")?.getAttribute("class") ?? "",
    );
    expect(iconClasses.length).toBe(ALL_LINKS.length);
    // notes→notebook / glossary→notes / books→book のマッピングどおりのアイコンが出る。
    const expected = (["notebook", "notes", "book"] as const).map((type) => {
      const { container: ref } = render(<Icon type={type} />);
      return ref.querySelector("span")?.getAttribute("class") ?? "";
    });
    expect(iconClasses).toEqual(expected);
  });
});
