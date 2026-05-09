import { describe, it, expect } from "vitest";
import { assertUniqueSlugs, deriveSlug } from "@/lib/content/slug.ts";
import { BuildError } from "@/lib/content/errors.ts";
import type { ContentItem, NotesFrontmatter } from "@/types/content.ts";

function makeNotesItem(slug: string, filePath: string): ContentItem<NotesFrontmatter> {
  return {
    type: "notes",
    slug,
    filePath,
    absolutePath: `/abs/${filePath}`,
    frontmatter: {
      created: "2025-01-01",
      updated: "2025-01-01",
    },
    body: "",
  };
}

describe("deriveSlug", () => {
  it("拡張子が落ちる", () => {
    expect(deriveSlug("note-a.md")).toBe("note-a");
  });

  it("サブフォルダ階層は反映しない (basename を使う)", () => {
    expect(deriveSlug("frontend/nested.md")).toBe("nested");
    expect(deriveSlug("a/b/c/deep.md")).toBe("deep");
  });

  it("日本語ファイル名はそのまま slug になる", () => {
    expect(deriveSlug("日本語ノート.md")).toBe("日本語ノート");
  });

  it("拡張子なしのファイルもそのまま", () => {
    expect(deriveSlug("readme")).toBe("readme");
  });
});

describe("assertUniqueSlugs", () => {
  it("重複なしならエラーなし", () => {
    expect(() =>
      assertUniqueSlugs([makeNotesItem("a", "a.md"), makeNotesItem("b", "b.md")]),
    ).not.toThrow();
  });

  it("同名 slug 衝突で BuildError を投げる", () => {
    expect(() =>
      assertUniqueSlugs([
        makeNotesItem("note-x", "note-x.md"),
        makeNotesItem("note-x", "sub/note-x.md"),
      ]),
    ).toThrowError(BuildError);
  });

  it("衝突エラーは category=slug-collision と両方のパスを含む", () => {
    try {
      assertUniqueSlugs([
        makeNotesItem("note-x", "note-x.md"),
        makeNotesItem("note-x", "sub/note-x.md"),
      ]);
      expect.unreachable("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BuildError);
      const buildErr = err as BuildError;
      expect(buildErr.category).toBe("slug-collision");
      expect(buildErr.message).toContain("note-x.md");
      expect(buildErr.message).toContain("sub/note-x.md");
    }
  });
});
