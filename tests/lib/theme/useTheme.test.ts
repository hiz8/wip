// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY } from "@/lib/theme/constants.ts";
import { useTheme } from "@/lib/theme/useTheme.ts";

interface MockMediaQueryList {
  matches: boolean;
  media: string;
  addEventListener: (event: string, handler: (e: MediaQueryListEvent) => void) => void;
  removeEventListener: (event: string, handler: (e: MediaQueryListEvent) => void) => void;
  dispatch: (matches: boolean) => void;
}

function installMatchMedia(initialMatches: boolean): MockMediaQueryList {
  const handlers = new Set<(e: MediaQueryListEvent) => void>();
  const list: MockMediaQueryList = {
    matches: initialMatches,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_event, handler) => {
      handlers.add(handler);
    },
    removeEventListener: (_event, handler) => {
      handlers.delete(handler);
    },
    dispatch: (matches: boolean) => {
      list.matches = matches;
      for (const h of handlers) h({ matches } as MediaQueryListEvent);
    },
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => list),
  );
  return list;
}

describe("useTheme", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.className = "";
    delete document.documentElement.dataset["theme"];
    delete document.documentElement.dataset["themeResolved"];
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to system and resolves from matchMedia", () => {
    installMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe("system");
    expect(result.current.resolved).toBe("light");
  });

  it("reads existing preference from localStorage", () => {
    installMatchMedia(false);
    window.localStorage.setItem(STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme());
    expect(result.current.preference).toBe("dark");
    expect(result.current.resolved).toBe("dark");
  });

  it("persists explicit preference and updates documentElement dataset", () => {
    installMatchMedia(false);
    const { result, rerender } = renderHook(() => useTheme());
    act(() => {
      result.current.setPreference("dark");
    });
    rerender();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    expect(document.documentElement.dataset["themeResolved"]).toBe("dark");
  });

  it("follows OS change while preference is system", () => {
    const media = installMatchMedia(false);
    const { result, rerender } = renderHook(() => useTheme());
    expect(result.current.resolved).toBe("light");
    act(() => {
      media.dispatch(true);
    });
    rerender();
    expect(result.current.resolved).toBe("dark");
  });
});
