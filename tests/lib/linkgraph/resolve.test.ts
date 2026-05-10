import { describe, expect, it } from "vitest";
import { buildContentIndex, resolveLinkTarget } from "@/lib/linkgraph/resolve.ts";
import { BuildError } from "@/lib/content/errors.ts";
import type {
  BooksFrontmatter,
  ContentItem,
  GlossaryFrontmatter,
  NotesFrontmatter,
} from "@/types/content.ts";

function note(slug: string, filePath = `${slug}.md`): ContentItem<NotesFrontmatter> {
  return {
    type: "notes",
    slug,
    filePath,
    absolutePath: `/vault/${filePath}`,
    frontmatter: {
      created: "2025-01-01T00:00:00+09:00",
      updated: "2025-01-01T00:00:00+09:00",
      status: "published",
    },
    body: "",
  };
}

describe("buildContentIndex", () => {
  it("ファイル名一致と type プレフィクス両方の索引を作る", () => {
    const items = [note("foo"), note("bar")];
    const index = buildContentIndex(items);
    expect(index.byName.get("foo")?.length).toBe(1);
    expect(index.byTypeName.get("notes/foo")?.slug).toBe("foo");
  });
});

describe("resolveLinkTarget", () => {
  const items = [note("foo"), note("bar")];
  const index = buildContentIndex(items);

  it("単一のファイル名一致を解決する", () => {
    const result = resolveLinkTarget(index, { fromFilePath: "src.md", rawTarget: "foo" });
    expect(result?.item.slug).toBe("foo");
    expect(result?.type).toBe("notes");
  });

  it("type プレフィクスを優先解決する", () => {
    const result = resolveLinkTarget(index, {
      fromFilePath: "src.md",
      rawTarget: "Notes/foo",
    });
    expect(result?.item.slug).toBe("foo");
  });

  it("section 指定 (#sec) は無視して解決する", () => {
    const result = resolveLinkTarget(index, {
      fromFilePath: "src.md",
      rawTarget: "foo#section",
    });
    expect(result?.item.slug).toBe("foo");
  });

  it("大文字小文字を無視してマッチする", () => {
    const result = resolveLinkTarget(index, { fromFilePath: "src.md", rawTarget: "FOO" });
    expect(result?.item.slug).toBe("foo");
  });

  it("未解決は null を返す", () => {
    const result = resolveLinkTarget(index, { fromFilePath: "src.md", rawTarget: "ghost" });
    expect(result).toBeNull();
  });

  it("曖昧な解決で BuildError を投げる", () => {
    const collidingIndex = buildContentIndex([note("dup", "a/dup.md"), note("dup", "b/dup.md")]);
    expect(() =>
      resolveLinkTarget(collidingIndex, { fromFilePath: "src.md", rawTarget: "dup" }),
    ).toThrow(BuildError);
  });

  it("不明な type プレフィクスは null", () => {
    const result = resolveLinkTarget(index, {
      fromFilePath: "src.md",
      rawTarget: "Glossary/missing",
    });
    expect(result).toBeNull();
  });
});

function glossary(
  slug: string,
  frontmatter: GlossaryFrontmatter,
): ContentItem<GlossaryFrontmatter> {
  return {
    type: "glossary",
    slug,
    filePath: `Glossary/${slug}.md`,
    absolutePath: `/vault/Glossary/${slug}.md`,
    frontmatter,
    body: "",
  };
}

function book(slug: string, frontmatter: BooksFrontmatter): ContentItem<BooksFrontmatter> {
  return {
    type: "books",
    slug,
    filePath: `Books/${slug}.md`,
    absolutePath: `/vault/Books/${slug}.md`,
    frontmatter,
    body: "",
  };
}

describe("buildContentIndex (cross-type)", () => {
  it("Glossary の term と aliases を byName に登録する", () => {
    const term = glossary("react-fiber", {
      term: "React Fiber",
      aliases: ["ファイバー"],
    });
    const index = buildContentIndex([term]);
    expect(index.byName.get("react fiber")?.[0]?.slug).toBe("react-fiber");
    expect(index.byName.get("ファイバー")?.[0]?.slug).toBe("react-fiber");
    expect(index.byTypeName.get("glossary/react-fiber")?.slug).toBe("react-fiber");
  });

  it("Books の aliases を byName に登録する", () => {
    const refactoring = book("9784873119045", {
      aliases: ["リファクタリング"],
      authors: ["Martin Fowler"],
    });
    const index = buildContentIndex([refactoring]);
    expect(index.byName.get("リファクタリング")?.[0]?.slug).toBe("9784873119045");
    expect(index.byTypeName.get("books/9784873119045")?.slug).toBe("9784873119045");
  });
});

describe("resolveLinkTarget (cross-type)", () => {
  it("Glossary 内の term で解決できる", () => {
    const items = [
      note("note-a"),
      glossary("react-fiber", { term: "React Fiber", aliases: ["ファイバー"] }),
    ];
    const index = buildContentIndex(items);
    const result = resolveLinkTarget(index, {
      fromFilePath: "note-a.md",
      rawTarget: "React Fiber",
    });
    expect(result?.type).toBe("glossary");
    expect(result?.item.slug).toBe("react-fiber");
  });

  it("Books の aliases で解決できる", () => {
    const items = [
      note("note-a"),
      book("9784873119045", { aliases: ["リファクタリング"], authors: ["Martin Fowler"] }),
    ];
    const index = buildContentIndex(items);
    const result = resolveLinkTarget(index, {
      fromFilePath: "note-a.md",
      rawTarget: "リファクタリング",
    });
    expect(result?.type).toBe("books");
    expect(result?.item.slug).toBe("9784873119045");
  });

  it("type プレフィクス [[Glossary/X]] が effective", () => {
    const items = [glossary("csr", { term: "CSR" })];
    const index = buildContentIndex(items);
    const result = resolveLinkTarget(index, {
      fromFilePath: "src.md",
      rawTarget: "Glossary/csr",
    });
    expect(result?.item.slug).toBe("csr");
  });

  it("Notes と Glossary alias が同名なら BuildError (曖昧)", () => {
    const items = [
      note("react-fiber"),
      glossary("rf", { term: "別の用語", aliases: ["react-fiber"] }),
    ];
    const index = buildContentIndex(items);
    expect(() =>
      resolveLinkTarget(index, {
        fromFilePath: "src.md",
        rawTarget: "react-fiber",
      }),
    ).toThrow(BuildError);
  });

  it("BuildError メッセージが 3 種類の type prefix を提案する", () => {
    const items = [note("dup"), glossary("dup-glossary", { aliases: ["dup"] })];
    const index = buildContentIndex(items);
    try {
      resolveLinkTarget(index, { fromFilePath: "src.md", rawTarget: "dup" });
      expect.unreachable("expected to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(BuildError);
      const msg = (err as BuildError).message;
      expect(msg).toContain("[[Notes/dup]]");
      expect(msg).toContain("[[Glossary/dup]]");
      expect(msg).toContain("[[Books/dup]]");
    }
  });
});
