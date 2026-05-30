import type { Root } from "mdast";
import { SKIP, visit } from "unist-util-visit";

export type MarginaliaSide = "left" | "right";

// AST をドキュメント順にたどり、すべての callout (blockquote[data-callout]) と
// 脚注参照に left/right を交互に割り当てる。偶数インデックスは right、奇数
// インデックスは left。side は data.hProperties に書き込まれ、下流で remark-rehype
// がそれを data-side という HTML 属性として実体化する。
//
// すべての blockquote で SKIP を返すことで、callout・embed・素の引用の内側に
// ネストした脚注参照がグローバルカウンタを進めないようにする (それらの aside は
// 独立した marginalia としてガターに到達することはない)。
export function assignMarginaliaSides(tree: Root): void {
  let index = 0;

  visit(tree, (node) => {
    if (node.type === "blockquote") {
      const props = (node.data?.hProperties ?? {}) as Record<string, unknown>;
      if (props["data-callout"] !== undefined) {
        setSide(node, sideFor(index));
        index += 1;
      }
      return SKIP;
    }

    if (node.type === "footnoteReference") {
      setSide(node, sideFor(index));
      index += 1;
    }
  });
}

function sideFor(index: number): MarginaliaSide {
  return index % 2 === 0 ? "right" : "left";
}

interface NodeWithData {
  data?: { hProperties?: Record<string, unknown> | undefined } | undefined;
}

function setSide(node: NodeWithData, side: MarginaliaSide) {
  const existing = (node.data?.hProperties ?? {}) as Record<string, unknown>;
  node.data = {
    ...node.data,
    hProperties: {
      ...existing,
      "data-side": side,
    },
  };
}
