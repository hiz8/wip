// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { useCloseOnNavigate } from "@/components/layout/useCloseOnNavigate.ts";

// `navigate()`（フック・`router.navigate` メソッドとも）の `to` はアプリ本体の
// `src/router.tsx` が `declare module` で登録した実サイトのルート集合にジェネリクスの
// 既定 (`RegisteredRouter`) 経由で拘束される。ここだけの合成ルート (`/item/$id`) を
// 持つローカルルーターはその集合に含まれず型付き navigate を使えないため、ルーターの
// 型に依存しない `history.push` で直接遷移させる。
function makeRouter(close: () => void) {
  const history = createMemoryHistory({ initialEntries: ["/item/1"] });
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const itemRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/item/$id",
    component: function ItemPage() {
      useCloseOnNavigate(close);
      const handleClick = useCallback(() => history.push("/item/2"), []);
      return (
        <button type="button" onClick={handleClick}>
          go
        </button>
      );
    },
  });
  return createRouter({
    routeTree: rootRoute.addChildren([itemRoute]),
    history,
  });
}

describe("useCloseOnNavigate", () => {
  it("同一ルートの兄弟遷移でパスが変わると close を呼ぶ", async () => {
    const close = vi.fn<() => void>();
    const user = userEvent.setup();
    render(<RouterProvider router={makeRouter(close)} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument());
    const callsAfterMount = close.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(close.mock.calls.length).toBeGreaterThan(callsAfterMount));
  });
});
