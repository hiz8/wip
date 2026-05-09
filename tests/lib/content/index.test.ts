import { describe, it, expect } from "vitest";
import { collectNotes } from "@/lib/content/index.ts";
import { BuildError } from "@/lib/content/errors.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("collectNotes", () => {
  it("vault から公開済み Notes のみを収集する", async () => {
    const items = await collectNotes(makeConfig("vault"));
    const slugs = items.map((i) => i.slug).sort();

    // 公開: note-a, note-b, frontend/nested → "nested", 日本語ノート
    expect(slugs).toContain("note-a");
    expect(slugs).toContain("note-b");
    expect(slugs).toContain("nested");
    expect(slugs).toContain("日本語ノート");

    // 非公開は除外
    expect(slugs).not.toContain("draft");
    expect(slugs).not.toContain("archived");

    // exclude 配下は除外
    expect(slugs.some((s) => s === "term")).toBe(false);
    expect(slugs.some((s) => s === "9784000000000")).toBe(false);
    expect(slugs.some((s) => s === "home")).toBe(false);
  });

  it("返される ContentItem は type=notes、frontmatter と body を持つ", async () => {
    const items = await collectNotes(makeConfig("vault"));
    const noteA = items.find((i) => i.slug === "note-a");
    expect(noteA).toBeDefined();
    expect(noteA?.type).toBe("notes");
    expect(noteA?.frontmatter.title).toBe("Note A の表示タイトル");
    expect(noteA?.frontmatter.status).toBe("published");
    expect(noteA?.body).toContain("# Note A");
  });

  it("frontmatter エラーで BuildError を投げる", async () => {
    await expect(collectNotes(makeConfig("vault-invalid"))).rejects.toBeInstanceOf(BuildError);
  });

  it("slug 衝突で BuildError を投げる", async () => {
    await expect(collectNotes(makeConfig("vault-collision"))).rejects.toMatchObject({
      name: "BuildError",
      category: "slug-collision",
    });
  });
});
