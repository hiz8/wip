import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeConfig } from "../helpers/makeConfig.ts";
import { __resetSiteDatasetForTests, __setSiteDatasetConfigForTests } from "@/server/datasets.ts";
import { getBlogModel, projectBlogListPage } from "@/server/blog.ts";

beforeEach(() => {
  __setSiteDatasetConfigForTests(makeConfig("vault"));
});
afterEach(() => {
  __resetSiteDatasetForTests();
});

describe("getBlogModel", () => {
  it("公開記事を作成日時降順で保持する", async () => {
    const model = await getBlogModel();
    expect(model.articles.map((a) => a.slug)).toEqual([
      "2025-12-11 0930",
      "2025-10-29 1400",
      "2025-07-24 0800",
      "2025-04-09 2145",
      "2025-02-14 0930",
    ]);
  });

  it("ページ集合とツリーが lock-step で一致する", async () => {
    const model = await getBlogModel();
    const fromTree = new Set<string>();
    const walk = (nodes: typeof model.tree) => {
      for (const n of nodes) {
        fromTree.add(n.tagset);
        walk(n.children);
      }
    };
    walk(model.tree);
    expect(fromTree).toEqual(new Set(model.pages.keys()));
  });
});

describe("projectBlogListPage", () => {
  it("トップページ: 全記事、それ以外のタグ = 全トークン", async () => {
    const model = await getBlogModel();
    const dto = projectBlogListPage(model, null, 1);
    expect(dto).not.toBeNull();
    expect(dto!.articles).toHaveLength(5);
    const top = dto!.articles[0]!;
    expect(top.otherTags?.labels).toEqual(["UI-UX", "マイクロコピー", "ライティング"]);
    expect(top.otherTags?.tagset).toBe("UI-UX+マイクロコピー+ライティング");
    expect(top.displayDate).toBe("2025/12/11");
    expect(top.anchorId).toBe("p-2025-12-11-0930");
  });

  it("タグ詳細: 絞り込み・省略表示・正規リンク先 (仕様イメージ B / 例 3)", async () => {
    const model = await getBlogModel();
    const dto = projectBlogListPage(model, "UI-UX", 1);
    expect(dto!.articles.map((a) => a.slug)).toEqual([
      "2025-12-11 0930",
      "2025-10-29 1400",
      "2025-07-24 0800",
      "2025-04-09 2145",
    ]);
    const hierarchical = dto!.articles.find((a) => a.slug === "2025-10-29 1400")!;
    // 階層タグは残りセグメントのみ表示、リンク先は冗長祖先を落とした正規形
    expect(hierarchical.otherTags?.labels).toEqual(["デザインシステム"]);
    expect(hierarchical.otherTags?.tagset).toBe("UI-UX--デザインシステム");
    // 「それ以外のタグ」なしの記事 (イメージ B の 2025/07/24)
    expect(dto!.articles.find((a) => a.slug === "2025-07-24 0800")!.otherTags).toBeNull();
  });

  it("パンくずは累積正規チェーン", async () => {
    const model = await getBlogModel();
    const dto = projectBlogListPage(model, "UI-UX+マイクロコピー+ライティング", 1);
    expect(dto!.breadcrumb).toEqual([
      { label: "#UI-UX", tagset: "UI-UX" },
      { label: "#UI-UX#マイクロコピー", tagset: "UI-UX+マイクロコピー" },
      { label: "#UI-UX#マイクロコピー#ライティング", tagset: "UI-UX+マイクロコピー+ライティング" },
    ]);
    expect(dto!.pageTitle).toBe("#UI-UX#マイクロコピー#ライティング");
  });

  it("Pagefind 対象は最も特定的な正規ページのみ", async () => {
    const model = await getBlogModel();
    const onParent = projectBlogListPage(model, "UI-UX", 1)!;
    expect(onParent.articles.find((a) => a.slug === "2025-10-29 1400")!.isCanonicalPage).toBe(
      false,
    );
    const onCanonical = projectBlogListPage(model, "UI-UX--デザインシステム", 1)!;
    expect(onCanonical.articles[0]!.isCanonicalPage).toBe(true);
  });

  it("非正規 tagset・範囲外ページは null", async () => {
    const model = await getBlogModel();
    // 非正規順
    expect(projectBlogListPage(model, "映画+スターウォーズ", 1)).toBeNull();
    expect(projectBlogListPage(model, "存在しない", 1)).toBeNull();
    // 4 件しかない
    expect(projectBlogListPage(model, "UI-UX", 2)).toBeNull();
  });
});
