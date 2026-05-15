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
import { BookCard } from "@/components/card/BookCard.tsx";

function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const bookRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books/$isbn",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, bookRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

const BASE_PROPS = {
  slug: "9784873119045",
  title: "リファクタリング",
  authors: ["Martin Fowler"],
  pubYear: 2019,
  summary: null,
  tags: ["software/engineering"],
} as const;

describe("BookCard", () => {
  it("renders a placeholder div when coverUrl is null", async () => {
    renderWithRouter(<BookCard {...BASE_PROPS} coverUrl={null} />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "リファクタリング" })).toBeInTheDocument(),
    );
    expect(document.querySelector('img[loading="lazy"]')).toBeNull();
    const placeholder = document.querySelector('div[aria-hidden="true"]');
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("リファクタリング");
  });

  it("renders an <img> when coverUrl is provided", async () => {
    renderWithRouter(<BookCard {...BASE_PROPS} coverUrl="/images/sample-cover.png" />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "リファクタリング" })).toBeInTheDocument(),
    );
    const img = document.querySelector('img[loading="lazy"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/images/sample-cover.png");
    expect(img?.getAttribute("alt")).toBe("");
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull();
  });
});
