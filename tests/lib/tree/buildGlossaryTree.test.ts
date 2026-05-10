import { describe, expect, it } from "vitest";
import { buildGlossaryTree } from "@/lib/tree/buildGlossaryTree.ts";
import type { RenderedGlossaryTerm } from "@/types/content.ts";

const noFurigana: string | undefined = undefined;

function term(slug: string, title: string, furigana: string | undefined): RenderedGlossaryTerm {
  return {
    type: "glossary",
    slug,
    filePath: `Glossary/${slug}.md`,
    absolutePath: `/vault/Glossary/${slug}.md`,
    frontmatter: furigana === undefined ? {} : { furigana },
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

describe("buildGlossaryTree", () => {
  it("五十音グループ単位のフォルダを返し、空の行は出力しない", () => {
    const items = [
      term("aaa", "アクセシビリティツリー", "あくせしびりてぃつりー"),
      term("rf", "React Fiber", "りあくとふぁいばー"),
      term("csr", "CSR", "しーえすあーる"),
      term("uf", "未指定", noFurigana),
    ];
    const tree = buildGlossaryTree(items);
    const groupNames = tree
      .filter((n) => n.kind === "folder")
      .map((n) => (n.kind === "folder" ? n.name : ""));
    expect(groupNames).toEqual(["あ行", "さ行", "ら行", "その他"]);
  });

  it("各行の子は furigana 昇順、子のラベルは title", () => {
    const items = [
      term("a2", "アスコット", "あすこっと"),
      term("a1", "アロエ", "あろえ"),
      term("a3", "アクア", "あくあ"),
    ];
    const tree = buildGlossaryTree(items);
    const aRow = tree.find((n) => n.kind === "folder" && n.name === "あ行");
    expect(aRow).toBeDefined();
    if (aRow?.kind === "folder") {
      const slugs = aRow.children.map((c) => (c.kind === "note" ? c.slug : ""));
      expect(slugs).toEqual(["a3", "a2", "a1"]);
    }
  });

  it("用語が 1 件もない行はフォルダを作らない", () => {
    const items = [term("u", "未指定", noFurigana)];
    const tree = buildGlossaryTree(items);
    expect(tree).toHaveLength(1);
    expect(tree[0]?.kind === "folder" && tree[0].name).toBe("その他");
  });

  it("fold node id は group: プレフィクス、note id は glossary: プレフィクス", () => {
    const items = [term("react-fiber", "React Fiber", "りあくとふぁいばー")];
    const tree = buildGlossaryTree(items);
    expect(tree[0]?.id).toBe("group:ら行");
    if (tree[0]?.kind === "folder") {
      expect(tree[0].children[0]?.id).toBe("glossary:react-fiber");
    }
  });
});
