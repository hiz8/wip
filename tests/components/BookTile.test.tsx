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
import { BookTile } from "@/components/card/BookTile.tsx";

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
  readDate: "2024-05-01",
} as const;

// 書影なしのプレースホルダはタイトル・著者を載せた装飾なので aria-hidden で探す。
function findPlaceholder() {
  return Array.from(document.querySelectorAll('span[aria-hidden="true"]')).find((el) =>
    el.textContent?.includes("リファクタリング"),
  );
}

describe("BookTile", () => {
  it("renders a pseudo-cover placeholder when coverUrl is null", async () => {
    renderWithRouter(<BookTile {...BASE_PROPS} coverUrl={null} />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /リファクタリング/u })).toBeInTheDocument(),
    );
    expect(document.querySelector('img[loading="lazy"]')).toBeNull();
    const placeholder = findPlaceholder();
    expect(placeholder).toBeDefined();
    expect(placeholder?.textContent).toContain("Martin Fowler");
  });

  it("renders an <img> when coverUrl is provided", async () => {
    renderWithRouter(<BookTile {...BASE_PROPS} coverUrl="/images/sample-cover.png" />);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /リファクタリング/u })).toBeInTheDocument(),
    );
    const img = document.querySelector('img[loading="lazy"]');
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/images/sample-cover.png");
    expect(img?.getAttribute("alt")).toBe("");
    expect(findPlaceholder()).toBeUndefined();
  });
});
