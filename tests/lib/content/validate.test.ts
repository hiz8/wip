import { describe, expect, it } from "vitest";
import {
  isPublished,
  validateBooksFrontmatter,
  validateGlossaryFrontmatter,
  validateNotesFrontmatter,
} from "@/lib/content/validate.ts";
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

describe("validateGlossaryFrontmatter", () => {
  it("term / furigana / aliases をすべて任意で許容し published にする", () => {
    const fm = validateGlossaryFrontmatter(
      {
        term: "アクセシビリティツリー",
        furigana: "あくせしびりてぃつりー",
        aliases: ["a11y tree"],
      },
      "Glossary/term.md",
    );
    expect(fm.term).toBe("アクセシビリティツリー");
    expect(fm.furigana).toBe("あくせしびりてぃつりー");
    expect(fm.aliases).toEqual(["a11y tree"]);
    expect(fm.status).toBe("published");
  });

  it("空の frontmatter でも default status が補完される", () => {
    const fm = validateGlossaryFrontmatter({}, "Glossary/empty.md");
    expect(fm.status).toBe("published");
    expect(fm.term).toBeUndefined();
    expect(fm.furigana).toBeUndefined();
  });

  it("aliases が文字列単体だと BuildError", () => {
    expect(() =>
      validateGlossaryFrontmatter({ aliases: "single" }, "Glossary/bad.md"),
    ).toThrowError(BuildError);
  });

  it("status が draft なら保持される", () => {
    const fm = validateGlossaryFrontmatter({ status: "draft" }, "Glossary/draft.md");
    expect(fm.status).toBe("draft");
  });
});

describe("validateBooksFrontmatter", () => {
  it("aliases / authors を必須として受け取る", () => {
    const fm = validateBooksFrontmatter(
      {
        aliases: ["リファクタリング"],
        authors: ["Martin Fowler"],
        pubYear: 2019,
        publisher: "O'Reilly",
      },
      "Books/9784873119045.md",
    );
    expect(fm.aliases).toEqual(["リファクタリング"]);
    expect(fm.authors).toEqual(["Martin Fowler"]);
    expect(fm.pubYear).toBe(2019);
    expect(fm.status).toBe("published");
  });

  it("aliases が空配列だと BuildError", () => {
    expect(() =>
      validateBooksFrontmatter({ aliases: [], authors: ["A"] }, "Books/bad.md"),
    ).toThrowError(BuildError);
  });

  it("authors が欠損だと BuildError", () => {
    expect(() => validateBooksFrontmatter({ aliases: ["x"] }, "Books/bad.md")).toThrowError(
      BuildError,
    );
  });

  it("pubYear が文字列だと BuildError", () => {
    expect(() =>
      validateBooksFrontmatter({ aliases: ["x"], authors: ["a"], pubYear: "2019" }, "Books/bad.md"),
    ).toThrowError(BuildError);
  });

  it("read_date は ISO 日付として保持される", () => {
    const fm = validateBooksFrontmatter(
      {
        aliases: ["x"],
        authors: ["a"],
        read_date: new Date("2024-08-01T00:00:00Z"),
      },
      "Books/x.md",
    );
    expect(fm.read_date).toBe("2024-08-01T00:00:00.000Z");
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
