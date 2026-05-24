import type { FootnoteDefinition, Root, RootContent } from "mdast";
import { visit } from "unist-util-visit";
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

  const inlineHtmlByIdentifier = new Map<string, string>();
  let counter = 0;
  for (const def of definitions) {
    counter += 1;
    const subtree: Root = { type: "root", children: [...def.children] };
    const html = await ctx.renderHtml(subtree);
    inlineHtmlByIdentifier.set(def.identifier, unwrapSingleParagraph(html));
    ctx.footnotes.push({
      id: def.identifier,
      label: def.label ?? String(counter),
      html,
    });
  }

  // Insert an inline aside next to every footnoteReference. The aside carries
  // the footnote content so CSS can float it into the gutter on wide
  // viewports without a separate React subtree. The trailing FootnoteSection
  // remains the source of truth for narrow viewports, so we only emit the
  // floating span here. The span is inline-level so it can live inside a
  // <p> next to the <sup> reference, but its inner HTML must not contain a
  // <p> block — otherwise the browser parser auto-closes the surrounding
  // paragraph and the span ends up empty. unwrapSingleParagraph above
  // removes the outer <p> wrapper for the common single-paragraph footnote.
  visit(tree, "footnoteReference", (node, index, parent) => {
    if (parent === undefined || index === undefined) return;
    const html = inlineHtmlByIdentifier.get(node.identifier);
    if (html === undefined) return;
    const side = readSide(node);
    const sideAttr = side ? ` data-side="${escapeAttr(side)}"` : "";
    const safeIdSuffix = sanitizeIdFragment(node.identifier);
    const idAttr = ` id="user-content-fn-aside-${safeIdSuffix}"`;
    const inlineHtml: RootContent = {
      type: "html",
      value: `<span class="footnote-aside"${idAttr}${sideAttr} role="note">${html}</span>`,
    };
    parent.children.splice(index + 1, 0, inlineHtml);
  });
}

// Strip a single outer <p>…</p> wrapper so the result can be safely embedded
// inside an inline span living inside another paragraph. Multi-paragraph
// footnotes (rare in practice) are returned unchanged; they may still cause
// nested <p> auto-close on the floating aside, but the trailing
// FootnoteSection covers narrow viewports where readability matters most.
function unwrapSingleParagraph(html: string): string {
  const trimmed = html.trim();
  if (!trimmed.startsWith("<p>") || !trimmed.endsWith("</p>")) return trimmed;
  const inner = trimmed.slice(3, -4);
  if (inner.includes("<p")) return trimmed;
  return inner;
}

interface NodeWithData {
  data?: { hProperties?: Record<string, unknown> | undefined } | undefined;
}

function readSide(node: NodeWithData): string | undefined {
  const v = node.data?.hProperties?.["data-side"];
  return typeof v === "string" ? v : undefined;
}

function escapeAttr(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function sanitizeIdFragment(value: string): string {
  return value.replaceAll(/[^a-zA-Z0-9_-]/gu, "_");
}
