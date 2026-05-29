import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import type { Blockquote, FootnoteReference, Paragraph, Root } from "mdast";
import { assignMarginaliaSides } from "@/lib/markdown/plugins/marginalia-side.ts";

function parse(md: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
}

function getSide(node: { data?: unknown }): unknown {
  const data = node.data as { hProperties?: Record<string, unknown> } | undefined;
  return data?.hProperties?.["data-side"];
}

function markCallout(node: Blockquote): void {
  node.data = {
    ...node.data,
    hProperties: {
      ...((node.data?.hProperties ?? {}) as Record<string, unknown>),
      "data-callout": "note",
    },
  };
}

describe("assignMarginaliaSides", () => {
  it("callout と footnoteReference を document order で右/左交互に振る", () => {
    const tree = parse(
      [
        "> [!note]",
        "> 一つめの callout",
        "",
        "本文に[^1]脚注。",
        "",
        "> [!warning]",
        "> 二つめの callout",
        "",
        "本文に[^2]脚注。",
        "",
        "[^1]: A",
        "[^2]: B",
      ].join("\n"),
    );

    // 2 つの blockquote を callout として印付ける (実際のパイプラインで
    // assignMarginaliaSides の前に走る applyCallout の hProperties 注釈を
    // 模倣する)。
    for (const child of tree.children) {
      if (child.type === "blockquote") markCallout(child as Blockquote);
    }

    assignMarginaliaSides(tree);

    const blockquotes = tree.children.filter((c): c is Blockquote => c.type === "blockquote");
    expect(getSide(blockquotes[0]!)).toBe("right");
    expect(getSide(blockquotes[1]!)).toBe("right");

    // 段落内のトップレベルの脚注参照を 2 つ探す。
    const refs: FootnoteReference[] = [];
    for (const c of tree.children) {
      if (c.type !== "paragraph") continue;
      for (const child of (c as Paragraph).children) {
        if (child.type === "footnoteReference") refs.push(child);
      }
    }
    expect(refs.length).toBe(2);
    expect(getSide(refs[0]!)).toBe("left");
    expect(getSide(refs[1]!)).toBe("left");
  });

  it("callout 内の footnoteReference はカウンタを進めない (SKIP)", () => {
    const tree = parse(
      ["> [!note]", "> callout 内[^1]の参照", "", "本文の[^2]参照", "", "[^1]: A", "[^2]: B"].join(
        "\n",
      ),
    );

    for (const child of tree.children) {
      if (child.type === "blockquote") markCallout(child as Blockquote);
    }

    assignMarginaliaSides(tree);

    const callout = tree.children.find((c): c is Blockquote => c.type === "blockquote");
    expect(getSide(callout!)).toBe("right");

    // visit が blockquote レベルで SKIP を返すため、callout の内側にネストした
    // 参照は side を付与されては「ならない」。
    let nestedRef: FootnoteReference | undefined;
    for (const c of callout!.children) {
      if (c.type !== "paragraph") continue;
      for (const child of c.children) {
        if (child.type === "footnoteReference") nestedRef = child;
      }
    }
    expect(nestedRef).toBeDefined();
    expect(getSide(nestedRef!)).toBeUndefined();

    // トップレベルの脚注参照が次のスロットを取る (index 1 → left)。
    let topRef: FootnoteReference | undefined;
    for (const c of tree.children) {
      if (c.type !== "paragraph") continue;
      for (const child of c.children) {
        if (child.type === "footnoteReference") topRef = child;
      }
    }
    expect(topRef).toBeDefined();
    expect(getSide(topRef!)).toBe("left");
  });

  it("data-callout を持たない blockquote は side を付けず、内部にも降りない", () => {
    const tree = parse(["> 通常の引用[^1]内の参照", "", "[^1]: A"].join("\n"));

    // 注釈なし: blockquote は素のまま。
    assignMarginaliaSides(tree);

    const bq = tree.children.find((c): c is Blockquote => c.type === "blockquote");
    expect(getSide(bq!)).toBeUndefined();

    // ネストした参照も side を受け取ってはならない。
    let nested: FootnoteReference | undefined;
    for (const c of bq!.children) {
      if (c.type !== "paragraph") continue;
      for (const child of c.children) {
        if (child.type === "footnoteReference") nested = child;
      }
    }
    expect(nested).toBeDefined();
    expect(getSide(nested!)).toBeUndefined();
  });
});
