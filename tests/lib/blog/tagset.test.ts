import { describe, expect, it } from "vitest";
import {
  articleFacets,
  blogArticleTitle,
  canonicalFullFacetSet,
  canonicalizeFacetSet,
  canonicalTagsetOf,
  compareCodePoints,
  decodeTagset,
  encodeTagset,
  facetSetSatisfies,
  validateBlogTagToken,
} from "@/lib/blog/tagset.ts";

describe("compareCodePoints", () => {
  it("Latin → カタカナ → 漢字 の順になる (仕様 L88 の例)", () => {
    const sorted = [
      "映画",
      "スターウォーズ",
      "UI-UX",
      "マイクロコピー",
      "デザインシステム",
      "ライティング",
    ].toSorted(compareCodePoints);
    expect(sorted).toEqual([
      "UI-UX",
      "スターウォーズ",
      "デザインシステム",
      "マイクロコピー",
      "ライティング",
      "映画",
    ]);
  });

  it("階層ファセットは論理パス文字列で比較する", () => {
    expect(compareCodePoints("UI-UX/デザインシステム", "UI-UX/マイクロコピー")).toBeLessThan(0);
  });
});

describe("validateBlogTagToken", () => {
  it("正常なトークンは null を返す", () => {
    expect(validateBlogTagToken("react")).toBeNull();
    // 単独の - は可
    expect(validateBlogTagToken("UI-UX")).toBeNull();
    expect(validateBlogTagToken("UI-UX/デザインシステム")).toBeNull();
  });

  it.each([
    ["", "空"],
    ["A/B/C", "深さ"],
    ["/A", "空セグメント"],
    ["A/", "空セグメント"],
    ["A//B", "空セグメント"],
    ["a+b", "+"],
    ["a--b", "--"],
    ["-a", "-"],
    ["a-", "-"],
    ["page", "予約語"],
    ["A/page", "予約語"],
  ])("%s は拒否される", (token) => {
    expect(validateBlogTagToken(token)).not.toBeNull();
  });
});

describe("facets / 正規形", () => {
  it("articleFacets は全プレフィックスの和を返す", () => {
    expect(articleFacets(["UI-UX/デザインシステム", "映画"])).toEqual([
      "UI-UX",
      "UI-UX/デザインシステム",
      "映画",
    ]);
  });

  it("canonicalizeFacetSet は冗長な祖先を落とす (仕様 L111)", () => {
    expect(canonicalizeFacetSet(["UI-UX", "UI-UX/デザインシステム"])).toEqual([
      "UI-UX/デザインシステム",
    ]);
  });

  it("canonicalizeFacetSet はコードポイント昇順に並べる", () => {
    expect(canonicalizeFacetSet(["映画", "スターウォーズ"])).toEqual(["スターウォーズ", "映画"]);
  });

  it("canonicalFullFacetSet はトークンから最特定の antichain を作る", () => {
    // #A と #A/B を両方持つ記事 → A は冗長
    expect(canonicalFullFacetSet(["UI-UX", "UI-UX/デザインシステム"])).toEqual([
      "UI-UX/デザインシステム",
    ]);
  });

  it("encodeTagset / decodeTagset は仕様の例と一致する (L104-108)", () => {
    expect(encodeTagset(["UI-UX"])).toBe("UI-UX");
    expect(encodeTagset(["UI-UX/デザインシステム"])).toBe("UI-UX--デザインシステム");
    expect(encodeTagset(["スターウォーズ", "映画"])).toBe("スターウォーズ+映画");
    expect(encodeTagset(["UI-UX/デザインシステム", "映画"])).toBe("UI-UX--デザインシステム+映画");
    expect(decodeTagset("UI-UX--デザインシステム+映画")).toEqual([
      "UI-UX/デザインシステム",
      "映画",
    ]);
  });

  it("canonicalTagsetOf は非正規入力 (順序違い・冗長祖先) を正規形へ収束させる", () => {
    expect(canonicalTagsetOf(["映画", "スターウォーズ"])).toBe("スターウォーズ+映画");
    expect(canonicalTagsetOf(["UI-UX", "UI-UX/デザインシステム", "映画"])).toBe(
      "UI-UX--デザインシステム+映画",
    );
  });

  it("facetSetSatisfies は部分集合判定 (⊇) を行う", () => {
    const article = new Set(["UI-UX", "UI-UX/デザインシステム", "映画"]);
    expect(facetSetSatisfies(article, ["UI-UX"])).toBe(true);
    expect(facetSetSatisfies(article, ["UI-UX/デザインシステム", "映画"])).toBe(true);
    expect(facetSetSatisfies(article, ["スターウォーズ"])).toBe(false);
  });

  it("blogArticleTitle は正規順の # 併記 (階層はフルパス)", () => {
    expect(blogArticleTitle(["ライティング", "UI-UX", "マイクロコピー"])).toBe(
      "#UI-UX#マイクロコピー#ライティング",
    );
    expect(blogArticleTitle(["UI-UX/デザインシステム"])).toBe("#UI-UX/デザインシステム");
  });
});
