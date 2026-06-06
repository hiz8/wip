// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "@/components/common/Tooltip.tsx";

function installMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "",
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

describe("Tooltip", () => {
  beforeEach(() => {
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the label on keyboard focus and hides it on blur", async () => {
    const user = userEvent.setup();
    render(
      <Tooltip label="ホーム">
        <button type="button" aria-label="ホーム">
          icon
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "ホーム" });
    await user.tab();
    expect(trigger).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("ホーム");
    // フォーカスを外すと閉じる (closeDelay=0)。
    await user.tab();
    await waitFor(() => expect(screen.queryByRole("tooltip")).toBeNull());
  });

  it("preserves the trigger accessible name", () => {
    render(
      <Tooltip label="検索">
        <button type="button" aria-label="検索">
          icon
        </button>
      </Tooltip>,
    );
    expect(screen.getByRole("button", { name: "検索" })).toBeInTheDocument();
  });
});
