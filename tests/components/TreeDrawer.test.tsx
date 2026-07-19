// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TreeDrawer } from "@/components/layout/TreeDrawer.tsx";

const noop = () => {};

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <TreeDrawer isOpen={open} onOpenChange={setOpen}>
        <div>tree content</div>
      </TreeDrawer>
    </>
  );
}

describe("TreeDrawer", () => {
  it("閉じているときは dialog を描画しない", () => {
    render(
      <TreeDrawer isOpen={false} onOpenChange={noop}>
        <div>tree content</div>
      </TreeDrawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("開いているときラベル付き dialog と children を描画する", () => {
    render(
      <TreeDrawer isOpen onOpenChange={noop}>
        <div>tree content</div>
      </TreeDrawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "コンテンツツリー" });
    expect(within(dialog).getByText("tree content")).toBeInTheDocument();
  });

  it("Escape で閉じる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
