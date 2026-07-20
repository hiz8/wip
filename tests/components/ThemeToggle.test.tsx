// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/common/ThemeToggle.tsx";
import { STORAGE_KEY } from "@/lib/theme/constants.ts";

function installMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "(prefers-color-scheme: dark)",
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    delete document.documentElement.dataset["theme"];
    delete document.documentElement.dataset["themeResolved"];
    installMatchMedia();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders with the light label by default when the OS prefers light", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /ライト/u })).toBeInTheDocument();
  });

  it("toggles between light and dark on click and persists to localStorage", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /ライト/u }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: /ダーク/u }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
  });

  it("updates documentElement dataset to reflect the chosen preference", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /ライト/u }));
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: /ダーク/u }));
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("exposes the label via a react-aria tooltip instead of a native title", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: /ライト/u });
    expect(button).not.toHaveAttribute("title");
    await user.tab();
    expect(button).toHaveFocus();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("テーマ: ライト");
  });
});
