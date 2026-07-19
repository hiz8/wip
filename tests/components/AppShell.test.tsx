// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function MockPagefindUI() {
  // 何もしない
}
vi.mock("/pagefind/pagefind-ui.js", () => ({ PagefindUI: MockPagefindUI }));

import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";

function installMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "",
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

const treeSidebarContent = <div>TREE ITEMS</div>;

function renderShell() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <AppShell variant="list" treeSidebar={treeSidebarContent}>
        <TreeDrawerTrigger />
      </AppShell>
    ),
  });
  const make = (p: string) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      make("/notes"),
      make("/glossary"),
      make("/books"),
      make("/blog"),
      make("/works"),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("AppShell tree drawer", () => {
  beforeEach(() => {
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("トリガー押下でドロワーが開き treeSidebar を表示する", async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = await screen.findByRole("button", { name: "コンテンツツリーを開く" });
    expect(screen.queryByRole("dialog", { name: "コンテンツツリー" })).toBeNull();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "コンテンツツリー" });
    expect(within(dialog).getByText("TREE ITEMS")).toBeInTheDocument();
  });
});
