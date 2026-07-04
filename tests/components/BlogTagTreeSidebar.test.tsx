// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { buildBlogTagTree } from "@/lib/blog/tree.ts";
import { __resetTreeExpansionForTests } from "@/lib/blog/treeExpansion.ts";

// RAC の Tree は treegrid としてレンダリングされ、各ノードは role="row"。
// ラベルは TanStack Router の <Link> で実 <a href> を出す (SSG の crawlLinks が
// data-href を辿れないため)。aria-current はそのラベル <a> に付与する。
const tree = buildBlogTagTree([
  { slug: "2025-12-11 0930", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-02-14 0930", tags: ["映画", "スターウォーズ"] },
]);

// ラベルの <Link> は router コンテキストを要求する。BlogArticleBlock.test と同じく
// 最小の memory router を組み、tagset の "+" を平文のまま扱わせる (本番 router.tsx と同設定)。
function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const make = (p: string) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      make("/blog/tags/$tagset"),
      make("/blog/tags/$tagset/page/$n"),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    pathParamsAllowedCharacters: ["+"],
  });
  return render(<RouterProvider router={router} />);
}

// サイドバーをルート (Outlet の外) に置き、ラベル Link のクリックで遷移しても
// アンマウントされないようにする。ラベルクリックが行の展開トグルを誘発するか
// (副作用) を遷移後も観測するために使う。
function renderPersistentSidebar(currentTagset: string | null) {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        <BlogTagTreeSidebar tree={tree} currentTagset={currentTagset} />
        <Outlet />
      </>
    ),
  });
  const make = (p: string) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      make("/"),
      make("/blog/tags/$tagset"),
      make("/blog/tags/$tagset/page/$n"),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    pathParamsAllowedCharacters: ["+"],
  });
  return render(<RouterProvider router={router} />);
}

beforeEach(() => {
  __resetTreeExpansionForTests();
});

describe("BlogTagTreeSidebar", () => {
  it("トップレベルのタグをコードポイント昇順で表示する", async () => {
    renderWithRouter(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    const rows = await screen.findAllByRole("row");
    const labels = rows.map((r) => r.textContent);
    // "UI-UX" は ASCII 'U' 始まりで、和文の根より必ず前に来る
    expect(labels[0]).toContain("UI-UX");
  });

  it("現在ページの集合と一致するノードをアクティブ (aria-current=page) 表示する", async () => {
    const { container } = renderWithRouter(
      <BlogTagTreeSidebar tree={tree} currentTagset="スターウォーズ+映画" />,
    );
    await screen.findAllByRole("row");
    // 既定展開は正規チェーンのみ (順列の双子は強制展開しない) のため可視は 1 つ以上
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current.length).toBeGreaterThanOrEqual(1);
  });

  it("ノードのラベルは実アンカー (role=link) で正規形 URL を href に持つ", async () => {
    renderWithRouter(<BlogTagTreeSidebar tree={tree} currentTagset="映画" />);
    const links = await screen.findAllByRole("link");
    // SSG の crawlLinks が辿れるのは本物の <a href> のみ。data-href の行では role=link は出ない。
    for (const link of links) expect(link.tagName).toBe("A");
    const hrefs = links.map((l) => decodeURIComponent(l.getAttribute("href") ?? ""));
    expect(hrefs).toContain("/blog/tags/映画");
  });

  it("トップは既定展開なし (可視行はトップレベルの根のみ)", async () => {
    renderWithRouter(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    const rows = await screen.findAllByRole("row");
    // 各トークンの根はすべてトップレベルに昇格する。畳まれていれば可視行はその数に一致する
    expect(rows).toHaveLength(tree.length);
  });

  it("コールド読み込みで現在集合の正規チェーンを既定展開する", async () => {
    renderWithRouter(<BlogTagTreeSidebar tree={tree} currentTagset="スターウォーズ+映画" />);
    const rows = await screen.findAllByRole("row");
    // チェーン (スターウォーズ > 映画) が開き、トップレベルの根より行が増える
    expect(rows.length).toBeGreaterThan(tree.length);
  });

  it("フィルタ中に chevron を往復操作してもフィルタ解除で展開が既定へ戻る", async () => {
    const user = userEvent.setup();
    renderWithRouter(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    // コールド null の可視行はトップの根のみ
    const before = (await screen.findAllByRole("row")).length;
    const input = screen.getByRole("textbox", { name: /filter/iu });
    await user.type(input, "UI-UX");
    // フィルタで自動展開されない子ノードの chevron を 開→閉 (純増減ゼロの往復)。
    // 自動展開分 (matchedIds) がユーザー保存状態へ焼き込まれると、クリア後も枝が開いたまま残る
    const chevron = screen.getAllByRole("button", { name: /^expand/iu })[0]!;
    await user.click(chevron);
    await user.click(chevron);
    await user.click(screen.getByRole("button", { name: /clear/iu }));
    expect(screen.getAllByRole("row")).toHaveLength(before);
  });

  it("フィルタ入力で一致ノードだけを残す", async () => {
    const user = userEvent.setup();
    renderWithRouter(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    await screen.findAllByRole("row");
    const input = screen.getByRole("textbox", { name: /filter/iu });
    await user.type(input, "映画");
    const labels = screen.getAllByRole("row").map((r) => r.textContent ?? "");
    expect(labels.some((l) => l.includes("映画"))).toBe(true);
    expect(labels.some((l) => l.includes("UI-UX"))).toBe(false);
  });

  // 回帰ガード: TreeItem から href を外すと react-aria が selectionMode="none" +
  // 子あり行に onAction=toggleKey を仕込む (useGridListItem.mjs:77)。ラベル Link の
  // press がこれへ伝播すると、遷移と同時にその行が展開/永続化されてしまう。
  // ラベルクリックは「遷移のみ」で、行の展開状態は不変であること。
  it("子を持つノードのラベルクリックは遷移するが行の展開状態を変えない", async () => {
    const user = userEvent.setup();
    renderPersistentSidebar(null);
    const uiuxRowBefore = (await screen.findAllByRole("row")).find((r) =>
      r.textContent?.includes("UI-UX"),
    )!;
    // 子ありトップレベル行は折りたたみで始まる
    expect(uiuxRowBefore.getAttribute("aria-expanded")).toBe("false");
    const before = screen.getAllByRole("row").length;

    await user.click(within(uiuxRowBefore).getByRole("link", { name: "UI-UX" }));

    // 遷移後もサイドバーは残る。行数が増えていれば toggleKey が誘発された = バグ。
    const uiuxRowAfter = screen
      .getAllByRole("row")
      .find((r) => within(r).queryByRole("link", { name: "UI-UX" }))!;
    expect(uiuxRowAfter.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getAllByRole("row")).toHaveLength(before);
  });
});
