import { describe, expect, it } from "vitest";
import { buildContentIndex, resolveLinkTarget } from "@/lib/linkgraph/resolve.ts";
import { BuildError } from "@/lib/content/errors.ts";
import type { ContentItem, NotesFrontmatter } from "@/types/content.ts";

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
      rawTarget: "Glossary/foo",
    });
    expect(result).toBeNull();
  });
});
