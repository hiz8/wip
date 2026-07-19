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
import { Breadcrumb } from "@/components/common/Breadcrumb.tsx";
import { TreeDrawerContext } from "@/components/layout/TreeDrawerContext.tsx";

// react-perf(jsx-no-new-object-as-prop) 回避のため Provider value をホイストする。
const treeCtx = { hasTree: true, open: () => {} };

function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const notesRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/notes",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, notesRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("Breadcrumb", () => {
  it("renders nav > ol > li with a root link, middle text, and current page", async () => {
    renderWithRouter(
      <Breadcrumb rootLabel="Notes" rootTo="/notes" middle="React" current="useEffect の整理" />,
    );
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    const items = document.querySelectorAll("nav > ol > li");
    expect(items).toHaveLength(3);
    const rootLink = screen.getByRole("link", { name: "Notes" });
    expect(rootLink.getAttribute("href")).toBe("/notes");
    expect(items[1]?.textContent).toContain("React");
    const current = document.querySelector('[aria-current="page"]');
    expect(current?.textContent).toBe("useEffect の整理");
  });

  it("omits the middle segment when it is null", async () => {
    renderWithRouter(<Breadcrumb rootLabel="Books" middle={null} current="一覧" />);
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    expect(document.querySelectorAll("nav > ol > li")).toHaveLength(2);
  });

  it("renders the root as plain text when rootTo is not given", async () => {
    renderWithRouter(<Breadcrumb rootLabel="Glossary" current="索引" />);
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("ツリーがある (hasTree=true) とき、crumbs の前にトリガーを描画する", async () => {
    renderWithRouter(
      <TreeDrawerContext.Provider value={treeCtx}>
        <Breadcrumb rootLabel="Notes" rootTo="/notes" current="x" />
      </TreeDrawerContext.Provider>,
    );
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    const trigger = screen.getByRole("button", { name: "コンテンツツリーを開く" });
    const ol = screen.getByRole("navigation").querySelector("ol");
    expect(ol).not.toBeNull();
    // トリガーは ol より前 (先頭) にある。
    expect(
      trigger.compareDocumentPosition(ol as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("Provider が無い (hasTree=false) 既定ではトリガーを描画しない", async () => {
    renderWithRouter(<Breadcrumb rootLabel="Notes" rootTo="/notes" current="x" />);
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "コンテンツツリーを開く" })).toBeNull();
  });
});
