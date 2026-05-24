import type { FootnoteDefinition, Parent, Root, RootContent } from "mdast";
import { visitParents } from "unist-util-visit-parents";
import type { FootnoteEntry } from "@/types/content.ts";

export interface FootnoteContext {
  footnotes: FootnoteEntry[];
  renderHtml: (subtree: Root) => Promise<string>;
}

interface PendingAside {
  container: Parent;
  paragraphIndex: number;
  html: string;
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

  const htmlByIdentifier = new Map<string, string>();
  let counter = 0;
  for (const def of definitions) {
    counter += 1;
    const subtree: Root = { type: "root", children: [...def.children] };
    const html = await ctx.renderHtml(subtree);
    htmlByIdentifier.set(def.identifier, html);
    ctx.footnotes.push({
      id: def.identifier,
      label: def.label ?? String(counter),
      html,
    });
  }

  // Collect block-level <aside> insertions next to every footnoteReference.
  // The aside is a sibling of the paragraph that contains the reference
  // (not nested inside it) so multi-paragraph and block-content footnote
  // bodies render safely; placing a block element inside an inline span
  // inside <p> would otherwise trigger HTML5 auto-close and break the float.
  //
  // CSS hides the aside on narrow viewports; the trailing FootnoteSection
  // takes over there.
  const pending: PendingAside[] = [];
  let ordinal = 0;
  visitParents(tree, "footnoteReference", (node, ancestors) => {
    const html = htmlByIdentifier.get(node.identifier);
    if (html === undefined) return;

    const location = findParagraphLocation(ancestors);
    if (!location) return;

    ordinal += 1;
    const side = readSide(node);
    const sideAttr = side ? ` data-side="${side}"` : "";
    const asideHtml = `<aside class="footnote-aside" id="user-content-fn-aside-${ordinal}"${sideAttr} role="note">${html}</aside>`;
    pending.push({
      container: location.container,
      paragraphIndex: location.index,
      html: asideHtml,
    });
  });

  // Splice in reverse document order so earlier insertions never shift the
  // indices captured for later ones.
  for (let i = pending.length - 1; i >= 0; i--) {
    const entry = pending[i];
    if (!entry) continue;
    const asideNode: RootContent = { type: "html", value: entry.html };
    entry.container.children.splice(entry.paragraphIndex + 1, 0, asideNode);
  }
}

// Find the nearest paragraph ancestor of the footnoteReference and the
// container that holds it. Returns the container parent and the paragraph's
// index inside that container so the caller can insert a sibling after it.
function findParagraphLocation(
  ancestors: readonly Parent[],
): { container: Parent; index: number } | null {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    if (!node || node.type !== "paragraph") continue;
    const container = ancestors[i - 1];
    if (!container) return null;
    const idx = container.children.indexOf(node as RootContent);
    if (idx === -1) return null;
    return { container, index: idx };
  }
  return null;
}

interface NodeWithData {
  data?: { hProperties?: Record<string, unknown> | undefined } | undefined;
}

function readSide(node: NodeWithData): "left" | "right" | undefined {
  const v = node.data?.hProperties?.["data-side"];
  return v === "left" || v === "right" ? v : undefined;
}
