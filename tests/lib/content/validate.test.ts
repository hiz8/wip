import { describe, it, expect } from "vitest";
import { isPublished, validateNotesFrontmatter } from "@/lib/content/validate.ts";
import { BuildError } from "@/lib/content/errors.ts";

describe("validateNotesFrontmatter", () => {
  it("正常な Notes frontmatter をパースし、status のデフォルトを補完する", () => {
    const fm = validateNotesFrontmatter(
      {
        title: "タイトル",
        created: "2025-01-01T00:00:00+09:00",
        updated: "2025-02-01T00:00:00+09:00",
        tags: ["react"],
      },
      "note-a.md",
    );
    expect(fm.title).toBe("タイトル");
    expect(fm.status).toBe("published");
    expect(fm.tags).toEqual(["react"]);
  });

  it("明示された status を保持する", () => {
    const fm = validateNotesFrontmatter(
      {
        created: "2025-01-01",
        updated: "2025-01-02",
        status: "draft",
      },
      "note.md",
    );
    expect(fm.status).toBe("draft");
  });

  it("created が欠損していると BuildError を投げる", () => {
    expect(() =>
      validateNotesFrontmatter(
        {
          updated: "2025-01-01",
        },
        "invalid.md",
      ),
    ).toThrowError(BuildError);
  });

  it("updated が欠損していると BuildError を投げる", () => {
    expect(() =>
      validateNotesFrontmatter(
        {
          created: "2025-01-01",
        },
        "invalid.md",
      ),
    ).toThrowError(BuildError);
  });

  it("tags が文字列単体だと BuildError を投げる", () => {
    expect(() =>
      validateNotesFrontmatter(
        {
          created: "2025-01-01",
          updated: "2025-01-02",
          tags: "react",
        },
        "invalid.md",
      ),
    ).toThrowError(BuildError);
  });

  it("不正な status 値は BuildError", () => {
    expect(() =>
      validateNotesFrontmatter(
        {
          created: "2025-01-01",
          updated: "2025-01-02",
          status: "unknown-status",
        },
        "invalid.md",
      ),
    ).toThrowError(BuildError);
  });

  it("BuildError のメッセージにファイルパスが含まれる", () => {
    try {
      validateNotesFrontmatter({ updated: "2025-01-01" }, "broken.md");
      expect.unreachable("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BuildError);
      const buildErr = err as BuildError;
      expect(buildErr.filePath).toBe("broken.md");
      expect(buildErr.message).toContain("broken.md");
      expect(buildErr.message).toContain("created");
    }
  });
});

describe("isPublished", () => {
  it("status が未指定なら published 扱い", () => {
    expect(isPublished({})).toBe(true);
  });

  it("draft / archived は非公開", () => {
    expect(isPublished({ status: "draft" })).toBe(false);
    expect(isPublished({ status: "archived" })).toBe(false);
  });

  it("published は公開", () => {
    expect(isPublished({ status: "published" })).toBe(true);
  });
});
