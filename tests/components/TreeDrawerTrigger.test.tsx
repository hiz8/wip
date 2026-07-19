// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import {
  TreeDrawerContext,
  type TreeDrawerContextValue,
} from "@/components/layout/TreeDrawerContext.tsx";
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";

function renderWithContext(value: TreeDrawerContextValue, ui: ReactNode) {
  return render(<TreeDrawerContext.Provider value={value}>{ui}</TreeDrawerContext.Provider>);
}

describe("TreeDrawerTrigger", () => {
  it("hasTree が false のとき何も描画しない", () => {
    renderWithContext({ hasTree: false, open: () => {} }, <TreeDrawerTrigger />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("hasTree が true のときボタンを描画し、クリックで open を呼ぶ", async () => {
    const open = vi.fn<() => void>();
    const user = userEvent.setup();
    renderWithContext({ hasTree: true, open }, <TreeDrawerTrigger />);
    const button = screen.getByRole("button", { name: "コンテンツツリーを開く" });
    await user.click(button);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
