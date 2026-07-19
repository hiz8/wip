// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TreeDrawerContext } from "@/components/layout/TreeDrawerContext.tsx";
import { BlogBreadcrumb, type BlogCrumb } from "@/components/blog/BlogBreadcrumb.tsx";

// react-perf(jsx-no-new-object-as-prop / jsx-no-new-array-as-prop) 回避のため
// Provider value と items をホイストする。
const treeCtx = { hasTree: true, open: () => {} };
const emptyItems: readonly BlogCrumb[] = [];

describe("BlogBreadcrumb", () => {
  it("ツリーがある (hasTree=true) とき、crumbs の前にトリガーを描画する", () => {
    render(
      <TreeDrawerContext.Provider value={treeCtx}>
        <BlogBreadcrumb items={emptyItems} />
      </TreeDrawerContext.Provider>,
    );
    const trigger = screen.getByRole("button", { name: "コンテンツツリーを開く" });
    const ol = screen.getByRole("navigation").querySelector("ol");
    expect(ol).not.toBeNull();
    expect(
      trigger.compareDocumentPosition(ol as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("既定 (hasTree=false) ではトリガーを描画しない", () => {
    render(<BlogBreadcrumb items={emptyItems} />);
    expect(screen.queryByRole("button", { name: "コンテンツツリーを開く" })).toBeNull();
  });
});
