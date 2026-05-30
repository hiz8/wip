// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
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
import { IconNav } from "@/components/layout/IconNav.tsx";

function installMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

function renderAtPath(path: string) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <IconNav />
        <Outlet />
      </>
    ),
  });
  const make = (p: string) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: p,
      component: () => null,
    });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      make("/"),
      make("/notes"),
      make("/notes/$slug"),
      make("/glossary"),
      make("/glossary/$slug"),
      make("/books"),
      make("/books/$isbn"),
    ]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("IconNav", () => {
  beforeEach(() => {
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders Glossary and Books as enabled <a> links (no disabled buttons)", async () => {
    renderAtPath("/");
    await waitFor(() => expect(screen.getByText("Notes")).toBeInTheDocument());
    expect(screen.getByText("Glossary")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
    expect(screen.queryByText(/coming soon/iu)).not.toBeInTheDocument();
    expect(document.querySelector('a[href="/glossary"]')).not.toBeNull();
    expect(document.querySelector('a[href="/books"]')).not.toBeNull();
  });

  it("treats /notes as the active section", async () => {
    renderAtPath("/notes");
    await waitFor(() => expect(screen.getByText("Notes")).toBeInTheDocument());
    const anchor = document.querySelector('a[href="/notes"]') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
  });

  it("treats /glossary/$slug as glossary-active", async () => {
    renderAtPath("/glossary/term");
    await waitFor(() => expect(screen.getByText("Glossary")).toBeInTheDocument());
    expect(document.querySelector('a[href="/glossary"]')).not.toBeNull();
  });

  it("treats /books/$isbn as books-active", async () => {
    renderAtPath("/books/9784000000000");
    await waitFor(() => expect(screen.getByText("Books")).toBeInTheDocument());
    expect(document.querySelector('a[href="/books"]')).not.toBeNull();
  });

  it("includes a Search button that opens the search dialog", async () => {
    const user = userEvent.setup();
    renderAtPath("/");
    const searchButton = await screen.findByRole("button", { name: /search/iu });
    await user.click(searchButton);
    expect(await screen.findByRole("dialog", { name: "サイト内検索" })).toBeInTheDocument();
  });
});
