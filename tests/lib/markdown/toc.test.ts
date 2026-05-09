import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import type { Root } from "mdast";
import { applyToc, extractFirstH1 } from "@/lib/markdown/plugins/toc.ts";
import type { TocEntry } from "@/types/content.ts";

function parse(md: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
}

describe("applyToc", () => {
  it("H2 / H3 のみを抽出し、H1 / H4 は無視する", () => {
    const tree = parse(["# H1", "## A", "### A1", "#### Skip", "## B"].join("\n\n"));
    const entries: TocEntry[] = [];
    applyToc(tree, { entries });
    expect(entries.map((e) => `${e.depth}:${e.text}`)).toEqual(["2:A", "3:A1", "2:B"]);
  });

  it("rehype-slug 互換の id を生成する", () => {
    const tree = parse("## Section A");
    const entries: TocEntry[] = [];
    applyToc(tree, { entries });
    expect(entries[0]?.id).toBe("section-a");
  });

  it("同じ見出しテキストには連番 suffix が付く", () => {
    const tree = parse(["## Section", "## Section"].join("\n\n"));
    const entries: TocEntry[] = [];
    applyToc(tree, { entries });
    expect(entries.map((e) => e.id)).toEqual(["section", "section-1"]);
  });
});

describe("extractFirstH1", () => {
  it("最初の H1 のテキストを返す", () => {
    const tree = parse("# 見出し\n\n本文");
    expect(extractFirstH1(tree)).toBe("見出し");
  });

  it("H1 がなければ null", () => {
    const tree = parse("## H2 のみ\n\n本文");
    expect(extractFirstH1(tree)).toBeNull();
  });
});
