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
  it.each<[Record<string, unknown>, string]>([
    [{ ...valid, tags: [] }, "tags 空"],
    [{ ...valid, tags: ["a", "b", "c", "d", "e"] }, "5 トークン"],
    [{ ...valid, tags: ["A/B/C"] }, "深さ 3"],
    [{ ...valid, tags: ["a+b"] }, "+ 入り"],
    [{ ...valid, tags: ["a--b"] }, "-- 入り"],
    [{ ...valid, tags: ["page"] }, "予約語"],
    [{ tags: valid.tags, status: "published" }, "updated 欠損"],
    [{ tags: valid.tags, updated: valid.updated }, "status 欠損 (Blog は明示必須)"],
    [{ ...valid, status: "public" }, "enum 違反"],
    [{ ...valid, title: "x" }, "禁止キー title"],
    [{ ...valid, summary: "x" }, "禁止キー summary"],
    [{ ...valid, featured: true }, "禁止キー featured"],
    [{ ...valid, created: "2025-01-01" }, "禁止キー created"],
  ])("%# %s はビルドエラー", (raw) => {
    expect(() => validateBlogFrontmatter(raw, path)).toThrowError(BuildError);
  });

  it("ファイル名が YYYY-MM-DD HHmm 形式でないとビルドエラー", () => {
    expect(() => validateBlogFrontmatter(valid, "Blog/メモ.md")).toThrowError(BuildError);
    expect(() => validateBlogFrontmatter(valid, "Blog/2025-13-99 0930.md")).toThrowError(
      BuildError,
    );
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
    await expect(collectBlog(makeConfig("vault-blog-invalid"))).rejects.toBeInstanceOf(BuildError);
  });
});
