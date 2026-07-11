// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { NavOverflowMenu } from "@/components/layout/NavOverflowMenu.tsx";
import type { MenuNavSection } from "@/components/layout/navSections.tsx";

const worksSection: MenuNavSection = {
  to: "/works",
  label: "Works",
  icon: "works",
  iconActive: "worksBold",
  isActive: (path) => path === "/works" || path.startsWith("/works/"),
};

// アイコンなしのセクション (今後の低重要度ページを想定)。
const iconlessSection: MenuNavSection = {
  to: "/blog",
  label: "Blog",
  isActive: (path) => path === "/blog" || path.startsWith("/blog/"),
};

function renderMenu(sections: MenuNavSection[], path = "/") {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <NavOverflowMenu sections={sections} path={path} placement="end" label="More" />
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
    routeTree: rootRoute.addChildren([make("/"), make("/works"), make("/blog")]),
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("NavOverflowMenu", () => {
  it("トリガー押下でメニューが開き、セクションがリンクとして並ぶ", async () => {
    const user = userEvent.setup();
    renderMenu([worksSection]);
    const trigger = await screen.findByRole("button", { name: "More" });
    await user.click(trigger);
    const item = await screen.findByRole("menuitem", { name: "Works" });
    expect(item).toHaveAttribute("href", "/works");
  });

  it("アイコンなしのセクションでもアイコンスロットを描画してラベル位置を揃える", async () => {
    const user = userEvent.setup();
    renderMenu([worksSection, iconlessSection]);
    await user.click(await screen.findByRole("button", { name: "More" }));
    const works = await screen.findByRole("menuitem", { name: "Works" });
    const blog = await screen.findByRole("menuitem", { name: "Blog" });
    // 先頭の span がアイコンスロット。アイコンありは中身 (Icon の span) を持ち、なしは空。
    const worksSlot = works.querySelector("span");
    const blogSlot = blog.querySelector("span");
    expect(worksSlot?.childElementCount).toBe(1);
    expect(blogSlot?.childElementCount).toBe(0);
  });

  it("複数セクションが渡された順に表示される (退避分 + 常設メニュー分の順序維持)", async () => {
    const user = userEvent.setup();
    renderMenu([iconlessSection, worksSection]);
    await user.click(await screen.findByRole("button", { name: "More" }));
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((el) => el.textContent)).toEqual(["Blog", "Works"]);
  });
});
