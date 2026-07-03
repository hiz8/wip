import { describe, expect, it } from "vitest";
import {
  BLOG_PAGE_SIZE,
  enumerateFacetPages,
  locateArticle,
  pageCount,
  pageSlice,
  remainingTokens,
} from "@/lib/blog/pages.ts";

// 仕様イメージ A / B に対応する記事セット (slug 降順 = 作成日時降順)
const articles = [
  { slug: "2025-12-11 0930", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-10-29 1400", tags: ["UI-UX/デザインシステム"] },
  { slug: "2025-07-24 0800", tags: ["UI-UX"] },
  { slug: "2025-04-09 2145", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-02-14 0930", tags: ["映画", "スターウォーズ"] },
];

describe("enumerateFacetPages", () => {
  const pages = enumerateFacetPages(articles);

  it("親ファセットのページは階層タグの記事も拾う (仕様 L122)", () => {
    expect(pages.get("UI-UX")?.slugs).toEqual([
      "2025-12-11 0930",
      "2025-10-29 1400",
      "2025-07-24 0800",
      "2025-04-09 2145",
    ]);
  });

  it("葉セグメント単独のページは生成しない (仕様 L78)", () => {
    expect(pages.has("デザインシステム")).toBe(false);
  });

  it("階層ファセットのページを生成する", () => {
    expect(pages.get("UI-UX--デザインシステム")?.slugs).toEqual(["2025-10-29 1400"]);
  });

  it("共起の集合ページを正規形キーで生成する (順列の重複キーはない)", () => {
    expect(pages.get("スターウォーズ+映画")?.slugs).toEqual(["2025-02-14 0930"]);
    expect(pages.has("映画+スターウォーズ")).toBe(false);
    expect(pages.get("UI-UX+マイクロコピー+ライティング")?.slugs).toEqual([
      "2025-12-11 0930",
      "2025-04-09 2145",
    ]);
  });

  it("ある集合のページが存在するなら、その任意の部分集合ページも存在する (仕様 L143)", () => {
    expect(pages.has("マイクロコピー+ライティング")).toBe(true);
    expect(pages.has("マイクロコピー")).toBe(true);
    expect(pages.has("ライティング")).toBe(true);
  });
});

describe("pagination", () => {
  it("10 件ごとに区切る", () => {
    expect(BLOG_PAGE_SIZE).toBe(10);
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(pageCount(23)).toBe(3);
    expect(pageSlice(items, 1)).toHaveLength(10);
    expect(pageSlice(items, 3)).toHaveLength(3);
    expect(pageSlice(items, 4)).toHaveLength(0);
  });
});

describe("locateArticle", () => {
  it("対象記事の掲載ページ番号を返す", () => {
    const pages = enumerateFacetPages(articles);
    expect(locateArticle(pages, "UI-UX", "2025-04-09 2145")).toEqual({ tagset: "UI-UX", page: 1 });
  });

  it("11 件目以降は page 2 になる", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      slug: `2025-01-${String(i + 1).padStart(2, "0")} 0900`,
      tags: ["映画"],
    }));
    const pages = enumerateFacetPages(many);
    expect(locateArticle(pages, "映画", "2025-01-01 0900")).toEqual({ tagset: "映画", page: 2 });
  });

  it("存在しない組み合わせは null", () => {
    const pages = enumerateFacetPages(articles);
    expect(locateArticle(pages, "映画", "2025-12-11 0930")).toBeNull();
  });
});

describe("remainingTokens", () => {
  it("トップページ (P = 空) では全トークンをフルパスで論理パス順に返す", () => {
    expect(remainingTokens(["ライティング", "UI-UX", "マイクロコピー"], [])).toEqual([
      { token: "UI-UX", label: "UI-UX" },
      { token: "マイクロコピー", label: "マイクロコピー" },
      { token: "ライティング", label: "ライティング" },
    ]);
  });

  it("ページで指定済みのトークンを除く (仕様イメージ B)", () => {
    expect(remainingTokens(["UI-UX", "マイクロコピー", "ライティング"], ["UI-UX"])).toEqual([
      { token: "マイクロコピー", label: "マイクロコピー" },
      { token: "ライティング", label: "ライティング" },
    ]);
    expect(remainingTokens(["UI-UX"], ["UI-UX"])).toEqual([]);
  });

  it("階層タグは親ファセットが指定済みなら残りセグメントのみ表示 (仕様 L238)", () => {
    expect(remainingTokens(["UI-UX/デザインシステム"], ["UI-UX"])).toEqual([
      { token: "UI-UX/デザインシステム", label: "デザインシステム" },
    ]);
    // 完全一致で指定済みなら除外
    expect(remainingTokens(["UI-UX/デザインシステム"], ["UI-UX/デザインシステム"])).toEqual([]);
  });
});
