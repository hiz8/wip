import GithubSlugger from "github-slugger";
import type { Root } from "mdast";
import { toString as mdastToString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";
import type { TocEntry } from "@/types/content.ts";

export interface TocContext {
  entries: TocEntry[];
}

export function applyToc(tree: Root, ctx: TocContext): void {
  const slugger = new GithubSlugger();
  visit(tree, "heading", (node) => {
    if (node.depth !== 1 && node.depth !== 2 && node.depth !== 3) {
      return;
    }
    const text = mdastToString(node).trim();
    const id = slugger.slug(text);
    if (node.depth === 2 || node.depth === 3) {
      ctx.entries.push({ depth: node.depth, text, id });
    }
  });
}

export function extractFirstH1(tree: Root): string | null {
  for (const node of tree.children) {
    if (node.type === "heading" && node.depth === 1) {
      const text = mdastToString(node).trim();
      return text.length > 0 ? text : null;
    }
  }
  return null;
}
