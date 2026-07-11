// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useOverflowCount } from "@/lib/nav/useOverflowCount.ts";

// matchMedia を「クエリ文字列 → matches」のマップで再現し、change イベントも発火できるようにする。
function installMatchMedia(matching: Set<string>) {
  const listeners = new Map<string, Set<() => void>>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      get matches() {
        return matching.has(query);
      },
      media: query,
      addEventListener: (_: "change", cb: () => void) => {
        const set = listeners.get(query) ?? new Set();
        set.add(cb);
        listeners.set(query, set);
      },
      removeEventListener: (_: "change", cb: () => void) => {
        listeners.get(query)?.delete(cb);
      },
    })),
  );
  return {
    fireChange() {
      for (const set of listeners.values()) for (const cb of set) cb();
    },
  };
}

const QUERIES = [
  "@media (max-width: 168px)",
  "@media (max-width: 224px)",
  "@media (max-width: 280px)",
  "@media (max-width: 336px)",
] as const;

describe("useOverflowCount", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("@media プレフィックスを外したクエリのマッチ数を返す", () => {
    installMatchMedia(new Set(["(max-width: 336px)", "(max-width: 280px)"]));
    const { result } = renderHook(() => useOverflowCount(QUERIES));
    expect(result.current).toBe(2);
  });

  it("マッチがなければ 0", () => {
    installMatchMedia(new Set());
    const { result } = renderHook(() => useOverflowCount(QUERIES));
    expect(result.current).toBe(0);
  });

  it("change イベントで再計算する", () => {
    const matching = new Set<string>();
    const media = installMatchMedia(matching);
    const { result } = renderHook(() => useOverflowCount(QUERIES));
    expect(result.current).toBe(0);
    act(() => {
      matching.add("(max-width: 336px)");
      media.fireChange();
    });
    expect(result.current).toBe(1);
  });
});
