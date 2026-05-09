import type { FootnoteDefinition, Root, RootContent } from "mdast";
import type { FootnoteEntry } from "@/types/content.ts";

export interface FootnoteContext {
  footnotes: FootnoteEntry[];
  renderHtml: (subtree: Root) => Promise<string>;
}

export async function applyFootnote(tree: Root, ctx: FootnoteContext): Promise<void> {
  const definitions: FootnoteDefinition[] = [];
  const remaining: RootContent[] = [];

  for (const node of tree.children) {
    if (node.type === "footnoteDefinition") {
      definitions.push(node);
    } else {
      remaining.push(node);
    }
  }
  tree.children = remaining;

  let counter = 0;
  for (const def of definitions) {
    counter += 1;
    const subtree: Root = { type: "root", children: [...def.children] };
    const html = await ctx.renderHtml(subtree);
    ctx.footnotes.push({
      id: def.identifier,
      label: def.label ?? String(counter),
      html,
    });
  }
}
