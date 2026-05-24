import type { Root } from "mdast";
import { SKIP, visit } from "unist-util-visit";

export type MarginaliaSide = "left" | "right";

// Walk the AST in document order and assign alternating left/right sides to
// every callout (blockquote[data-callout]) and footnote reference. Even index
// goes right, odd index goes left. The side is written to data.hProperties so
// remark-rehype materializes it as a data-side HTML attribute downstream.
//
// SKIP is returned for every blockquote so that footnote references nested
// inside callouts, embeds, or plain quotes do not advance the global counter
// (their asides never reach the gutter as independent marginalia).
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
