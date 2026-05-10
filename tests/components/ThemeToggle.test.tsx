// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
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

  it("renders with the system label by default", () => {
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /システム/ })).toBeInTheDocument();
  });

  it("cycles through preferences on click and persists to localStorage", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /システム/ }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
    fireEvent.click(screen.getByRole("button", { name: /ライト/ }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
    fireEvent.click(screen.getByRole("button", { name: /ダーク/ }));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("system");
  });

  it("updates documentElement dataset to reflect the chosen preference", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /システム/ }));
    expect(document.documentElement.dataset["theme"]).toBe("light");
    fireEvent.click(screen.getByRole("button", { name: /ライト/ }));
    expect(document.documentElement.dataset["theme"]).toBe("dark");
  });
});
