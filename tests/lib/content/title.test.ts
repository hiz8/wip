import { describe, expect, it } from "vitest";
import { pickContentTitle } from "@/lib/content/title.ts";
import type {
  BooksFrontmatter,
  ContentItem,
  GlossaryFrontmatter,
  NotesFrontmatter,
} from "@/types/content.ts";

function makeNote(slug: string, frontmatter: NotesFrontmatter): ContentItem<NotesFrontmatter> {
  return {
    type: "notes",
    slug,
    filePath: `${slug}.md`,
    absolutePath: `/abs/${slug}.md`,
    frontmatter,
    body: "",
  };
}

function makeGlossary(
  slug: string,
  frontmatter: GlossaryFrontmatter,
): ContentItem<GlossaryFrontmatter> {
  return {
    type: "glossary",
    slug,
    filePath: `Glossary/${slug}.md`,
    absolutePath: `/abs/Glossary/${slug}.md`,
    frontmatter,
    body: "",
  };
}

function makeBook(slug: string, frontmatter: BooksFrontmatter): ContentItem<BooksFrontmatter> {
  return {
    type: "books",
    slug,
    filePath: `Books/${slug}.md`,
    absolutePath: `/abs/Books/${slug}.md`,
    frontmatter,
    body: "",
  };
}

describe("pickContentTitle", () => {
  it("Notes は frontmatter.title を優先する", () => {
    const item = makeNote("hello", {
      title: "Hello, World",
      created: "2025-01-01",
      updated: "2025-01-01",
    });
    expect(pickContentTitle(item)).toBe("Hello, World");
  });

  it("Notes は title 未指定なら slug にフォールバック", () => {
    const item = makeNote("fallback", {
      created: "2025-01-01",
      updated: "2025-01-01",
    });
    expect(pickContentTitle(item)).toBe("fallback");
  });

  it("Notes の title 空白のみは slug にフォールバック", () => {
    const item = makeNote("ws", {
      title: "   ",
      created: "2025-01-01",
      updated: "2025-01-01",
    });
    expect(pickContentTitle(item)).toBe("ws");
  });

  it("Glossary は frontmatter.term を優先する", () => {
    const item = makeGlossary("term-slug", { term: "用語名" });
    expect(pickContentTitle(item)).toBe("用語名");
  });

  it("Glossary は term 未指定なら slug", () => {
    const item = makeGlossary("just-slug", {});
    expect(pickContentTitle(item)).toBe("just-slug");
  });

  it("Books は aliases[0] を優先する", () => {
    const item = makeBook("9784000000000", {
      aliases: ["書籍タイトル", "別名"],
      authors: ["著者A"],
    });
    expect(pickContentTitle(item)).toBe("書籍タイトル");
  });

  it("Books の aliases[0] が空白のみなら slug にフォールバック", () => {
    const item = makeBook("9784000000001", {
      aliases: [" "],
      authors: ["著者A"],
    });
    expect(pickContentTitle(item)).toBe("9784000000001");
  });
});
