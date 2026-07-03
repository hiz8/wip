// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { buildBlogTagTree } from "@/lib/blog/tree.ts";
import { __resetTreeExpansionForTests } from "@/lib/blog/treeExpansion.ts";

// RAC の Tree は treegrid としてレンダリングされ、各ノードは role="row"。
// href は data-href 属性 (JS ナビゲーション) となり、ネイティブ <a>/role="link" は出ない。
// aria-current は filterDOMProps に弾かれるため row 要素には乗らず、ラベル span に付与する。
const tree = buildBlogTagTree([
  { slug: "2025-12-11 0930", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-02-14 0930", tags: ["映画", "スターウォーズ"] },
]);

beforeEach(() => {
  __resetTreeExpansionForTests();
});

describe("BlogTagTreeSidebar", () => {
  it("トップレベルのタグをコードポイント昇順で表示する", () => {
    render(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    const labels = screen.getAllByRole("row").map((r) => r.textContent);
    // "UI-UX" は ASCII 'U' 始まりで、和文の根より必ず前に来る
    expect(labels[0]).toContain("UI-UX");
  });

  it("現在ページの集合と一致するノードをアクティブ (aria-current=page) 表示する", () => {
    const { container } = render(
      <BlogTagTreeSidebar tree={tree} currentTagset="スターウォーズ+映画" />,
    );
    // 既定展開は正規チェーンのみ (順列の双子は強制展開しない) のため可視は 1 つ以上
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current.length).toBeGreaterThanOrEqual(1);
  });

  it("ノードのリンクは正規形 URL を data-href に持つ", () => {
    render(<BlogTagTreeSidebar tree={tree} currentTagset="映画" />);
    const hrefs = screen.getAllByRole("row").map((r) => r.dataset["href"]);
    expect(hrefs).toContain("/blog/tags/映画");
  });

  it("トップは既定展開なし (可視行はトップレベルの根のみ)", () => {
    render(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    // 各トークンの根はすべてトップレベルに昇格する。畳まれていれば可視行はその数に一致する
    expect(screen.getAllByRole("row")).toHaveLength(tree.length);
  });

  it("コールド読み込みで現在集合の正規チェーンを既定展開する", () => {
    render(<BlogTagTreeSidebar tree={tree} currentTagset="スターウォーズ+映画" />);
    // チェーン (スターウォーズ > 映画) が開き、トップレベルの根より行が増える
    expect(screen.getAllByRole("row").length).toBeGreaterThan(tree.length);
  });

  it("フィルタ中に chevron を往復操作してもフィルタ解除で展開が既定へ戻る", async () => {
    const user = userEvent.setup();
    render(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    // コールド null の可視行はトップの根のみ
    const before = screen.getAllByRole("row").length;
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
    render(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    const input = screen.getByRole("textbox", { name: /filter/iu });
    await user.type(input, "映画");
    const labels = screen.getAllByRole("row").map((r) => r.textContent ?? "");
    expect(labels.some((l) => l.includes("映画"))).toBe(true);
    expect(labels.some((l) => l.includes("UI-UX"))).toBe(false);
  });
});
