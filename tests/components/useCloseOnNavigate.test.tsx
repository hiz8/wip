// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useCloseOnNavigate } from "@/components/layout/useCloseOnNavigate.ts";

function makeRouter(close: () => void) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const itemRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/item/$id",
    component: function ItemPage() {
      useCloseOnNavigate(close);
      const navigate = useNavigate();
      return (
        <button type="button" onClick={() => navigate({ to: "/item/$id", params: { id: "2" } })}>
          go
        </button>
      );
    },
  });
  return createRouter({
    routeTree: rootRoute.addChildren([itemRoute]),
    history: createMemoryHistory({ initialEntries: ["/item/1"] }),
  });
}

describe("useCloseOnNavigate", () => {
  it("同一ルートの兄弟遷移でパスが変わると close を呼ぶ", async () => {
    const close = vi.fn();
    const user = userEvent.setup();
    render(<RouterProvider router={makeRouter(close)} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument());
    const callsAfterMount = close.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(close.mock.calls.length).toBeGreaterThan(callsAfterMount));
  });
});
