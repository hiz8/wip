import { describe, expect, it } from "vitest";
import {
  aggregateTags,
  decodeTagSlug,
  encodeTagToSlug,
  filterByTag,
  matchesTag,
  tagAncestors,
} from "@/lib/tags/tags.ts";

describe("encodeTagToSlug / decodeTagSlug", () => {
  it("階層タグの / を -- にエスケープする", () => {
    expect(encodeTagToSlug("frontend/react")).toBe("frontend--react");
    expect(decodeTagSlug("frontend--react")).toBe("frontend/react");
  });

  it("階層のないタグはそのまま", () => {
    expect(encodeTagToSlug("react")).toBe("react");
    expect(decodeTagSlug("react")).toBe("react");
  });

  it("多段階層を round-trip できる", () => {
    for (const tag of ["a/b/c", "react", "frontend/css", "日本語/タグ"]) {
      expect(decodeTagSlug(encodeTagToSlug(tag))).toBe(tag);
    }
  });
});

describe("tagAncestors", () => {
  it("自身と全祖先を返す", () => {
    expect(tagAncestors("a/b/c")).toEqual(["a", "a/b", "a/b/c"]);
    expect(tagAncestors("react")).toEqual(["react"]);
  });
});

describe("matchesTag", () => {
  it("完全一致と子孫一致を判定する", () => {
    expect(matchesTag("frontend", "frontend")).toBe(true);
    expect(matchesTag("frontend/react", "frontend")).toBe(true);
    expect(matchesTag("frontend/react", "frontend/react")).toBe(true);
  });

  it("接頭辞が異なる/別タグはマッチしない", () => {
    expect(matchesTag("frontend", "frontend/react")).toBe(false);
    expect(matchesTag("frontendish", "frontend")).toBe(false);
    expect(matchesTag("backend", "frontend")).toBe(false);
  });
});

describe("aggregateTags", () => {
  it("祖先タグを合成し、件数を階層マッチで数える", () => {
    const items = [{ tags: ["frontend/react"] }, { tags: ["frontend/css"] }, { tags: ["backend"] }];
    const result = aggregateTags(items);
    const byTag = new Map(result.map((r) => [r.tag, r.count]));
    // 直接書かれていなくても祖先が合成される
    expect(byTag.get("frontend")).toBe(2);
    expect(byTag.get("frontend/react")).toBe(1);
    expect(byTag.get("frontend/css")).toBe(1);
    expect(byTag.get("backend")).toBe(1);
  });

  it("件数降順 → 同数はタグ昇順でソートする", () => {
    const items = [{ tags: ["b"] }, { tags: ["a"] }, { tags: ["c", "a"] }];
    const result = aggregateTags(items);
    expect(result.map((r) => r.tag)).toEqual(["a", "b", "c"]);
    expect(result[0]).toEqual({ tag: "a", count: 2 });
  });

  it("空入力では空配列を返す", () => {
    expect(aggregateTags([])).toEqual([]);
  });
});

describe("filterByTag", () => {
  it("親タグで子タグを持つ項目も含める", () => {
    const items = [
      { slug: "x", tags: ["frontend/react"] },
      { slug: "y", tags: ["frontend"] },
      { slug: "z", tags: ["backend"] },
    ];
    expect(filterByTag(items, "frontend").map((i) => i.slug)).toEqual(["x", "y"]);
    expect(filterByTag(items, "frontend/react").map((i) => i.slug)).toEqual(["x"]);
    expect(filterByTag(items, "backend").map((i) => i.slug)).toEqual(["z"]);
  });

  it("一致なしでは空配列", () => {
    expect(filterByTag([{ slug: "x", tags: ["a"] }], "missing")).toEqual([]);
  });
});
