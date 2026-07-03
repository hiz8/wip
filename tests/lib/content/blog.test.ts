import { describe, expect, it } from "vitest";
import { collectBlog, validateBlogFrontmatter } from "@/lib/content/index.ts";
import { BuildError } from "@/lib/content/errors.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("validateBlogFrontmatter", () => {
  const valid = {
    tags: ["UI-UX", "マイクロコピー"],
    updated: "2025-12-20T10:00:00+09:00",
    status: "published",
  };
  const path = "Blog/2025-12-11 0930.md";

  it("正常な frontmatter を通す", () => {
    const fm = validateBlogFrontmatter(valid, path);
    expect(fm.tags).toEqual(["UI-UX", "マイクロコピー"]);
    expect(fm.status).toBe("published");
  });

  // 各行の frontmatter は欠損キー・型がまちまちなので、タプル型を明示して
  // it.each のオーバーロード解決 (行ごとのタプル型の union 化) を避ける。
  // BuildError の category / field / filePath まで検証し、エラー箇所の特定情報が
  // 退化する regression (例: field を固定文字列に差し替える) を検出できるようにする。
  it.each<[string, Record<string, unknown>, string]>([
    ["tags 空", { ...valid, tags: [] }, "tags"],
    ["5 トークン", { ...valid, tags: ["a", "b", "c", "d", "e"] }, "tags"],
    ["深さ 3", { ...valid, tags: ["A/B/C"] }, "tags"],
    ["+ 入り", { ...valid, tags: ["a+b"] }, "tags"],
    ["-- 入り", { ...valid, tags: ["a--b"] }, "tags"],
    ["予約語", { ...valid, tags: ["page"] }, "tags"],
    ["updated 欠損", { tags: valid.tags, status: "published" }, "updated"],
    ["status 欠損 (Blog は明示必須)", { tags: valid.tags, updated: valid.updated }, "status"],
    ["enum 違反", { ...valid, status: "public" }, "status"],
    ["禁止キー title", { ...valid, title: "x" }, "title"],
    ["禁止キー summary", { ...valid, summary: "x" }, "summary"],
    ["禁止キー featured", { ...valid, featured: true }, "featured"],
    ["禁止キー created", { ...valid, created: "2025-01-01" }, "created"],
  ])("%# %s はビルドエラー", (_label, raw, expectedField) => {
    try {
      validateBlogFrontmatter(raw, path);
      expect.unreachable("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BuildError);
      const buildErr = err as BuildError;
      expect(buildErr.category).toBe("invalid-frontmatter");
      expect(buildErr.field).toBe(expectedField);
      expect(buildErr.filePath).toBe(path);
    }
  });

  it("ファイル名が YYYY-MM-DD HHmm 形式でないとビルドエラー", () => {
    for (const badPath of ["Blog/メモ.md", "Blog/2025-13-99 0930.md"]) {
      try {
        validateBlogFrontmatter(valid, badPath);
        expect.unreachable("expected to throw");
      } catch (err) {
        expect(err).toBeInstanceOf(BuildError);
        const buildErr = err as BuildError;
        expect(buildErr.category).toBe("invalid-frontmatter");
        expect(buildErr.filePath).toBe(badPath);
      }
    }
  });
});

describe("collectBlog", () => {
  it("公開記事のみを収集し draft を除外する", async () => {
    const items = await collectBlog(makeConfig("vault"));
    const slugs = items.map((i) => i.slug);
    expect(slugs).toContain("2025-12-11 0930");
    // "2024-12-01 0000" は draft のため除外される
    expect(slugs).not.toContain("2024-12-01 0000");
    expect(items.every((i) => i.type === "blog")).toBe(true);
  });

  it("不正なファイル名の Vault は BuildError で失敗する", async () => {
    await expect(collectBlog(makeConfig("vault-blog-invalid"))).rejects.toMatchObject({
      name: "BuildError",
      category: "invalid-frontmatter",
    });
  });
});
