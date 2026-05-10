import { describe, expect, it } from "vitest";
import { buildBooksTree } from "@/lib/tree/buildBooksTree.ts";
import type { RenderedBook } from "@/types/content.ts";

const noYear: number | undefined = undefined;

function book(slug: string, title: string, pubYear: number | undefined): RenderedBook {
  const fm: RenderedBook["frontmatter"] = {
    aliases: [title],
    authors: ["著者"],
  };
  if (pubYear !== undefined) fm.pubYear = pubYear;
  return {
    type: "books",
    slug,
    filePath: `Books/${slug}.md`,
    absolutePath: `/vault/Books/${slug}.md`,
    frontmatter: fm,
    body: "",
    html: "",
    title,
    toc: [],
    outgoingLinks: [],
    incomingLinks: [],
    footnotes: [],
    callouts: [],
    images: [],
  };
}

describe("buildBooksTree", () => {
  it("全アイテムをフラットな note ノードとして配置する", () => {
    const tree = buildBooksTree([
      book("9784000000000", "テスト書籍", 2020),
      book("9784000000001", "サンプル書籍", 2018),
    ]);
    expect(tree).toHaveLength(2);
    expect(tree.every((n) => n.kind === "note")).toBe(true);
  });

  it("pubYear 降順 (新しい順) に並ぶ", () => {
    const tree = buildBooksTree([book("c", "C", 2018), book("a", "A", 2022), book("b", "B", 2020)]);
    expect(tree.map((n) => (n.kind === "note" ? n.slug : ""))).toEqual(["a", "b", "c"]);
  });

  it("pubYear 未指定は末尾に並ぶ", () => {
    const tree = buildBooksTree([book("with", "B", 2020), book("noyear", "A", noYear)]);
    expect(tree.map((n) => (n.kind === "note" ? n.slug : ""))).toEqual(["with", "noyear"]);
  });

  it("pubYear 同値時は title locale ja で比較", () => {
    const tree = buildBooksTree([book("b", "ば", 2020), book("a", "あ", 2020)]);
    expect(tree.map((n) => (n.kind === "note" ? n.slug : ""))).toEqual(["a", "b"]);
  });

  it("note id は books: プレフィクス、path は books/<slug>", () => {
    const tree = buildBooksTree([book("9784", "x", 2020)]);
    if (tree[0]?.kind === "note") {
      expect(tree[0].id).toBe("books:9784");
      expect(tree[0].path).toBe("books/9784");
    }
  });
});
