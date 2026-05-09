import type { Parent, PhrasingContent, Root, RootContent, Text } from "mdast";
import type { ContentIndex } from "@/lib/linkgraph/resolve.ts";
import { resolveLinkTarget } from "@/lib/linkgraph/resolve.ts";
import type { OutgoingLink } from "@/types/content.ts";

const WIKI_LINK_RE = /!?\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]/g;

export interface WikiLinkContext {
  index: ContentIndex;
  fromFilePath: string;
  outgoing: OutgoingLink[];
  embedded: boolean;
}

export function applyWikiLink(tree: Root, ctx: WikiLinkContext): void {
  rewriteTextNodes(tree, (text) => {
    if (!text.includes("[[")) return null;
    const matches = [...text.matchAll(WIKI_LINK_RE)];
    if (matches.length === 0) return null;
    return splitText(text, matches, ctx);
  });
}

function splitText(
  source: string,
  matches: RegExpMatchArray[],
  ctx: WikiLinkContext,
): PhrasingContent[] {
  const out: PhrasingContent[] = [];
  let cursor = 0;
  for (const match of matches) {
    const start = match.index ?? 0;
    if (start > cursor) {
      out.push({ type: "text", value: source.slice(cursor, start) });
    }
    const target = match[1] ?? "";
    const alias = match[2];
    out.push(makeWikiLinkNode(target, alias, ctx));
    cursor = start + match[0].length;
  }
  if (cursor < source.length) {
    out.push({ type: "text", value: source.slice(cursor) });
  }
  return out;
}

function makeWikiLinkNode(
  rawTarget: string,
  alias: string | undefined,
  ctx: WikiLinkContext,
): PhrasingContent {
  const trimmedAlias = alias?.trim();
  const display = trimmedAlias && trimmedAlias.length > 0 ? trimmedAlias : rawTarget.trim();

  const resolved = resolveLinkTarget(ctx.index, {
    fromFilePath: ctx.fromFilePath,
    rawTarget,
  });
  if (!resolved) {
    return { type: "text", value: display };
  }

  ctx.outgoing.push({
    type: resolved.type,
    slug: resolved.item.slug,
    raw: rawTarget,
    embedded: ctx.embedded,
  });

  return {
    type: "link",
    url: `/${resolved.type}/${resolved.item.slug}`,
    title: null,
    children: [{ type: "text", value: display }],
  };
}

type TextRewriter = (value: string) => PhrasingContent[] | null;

export function rewriteTextNodes(parent: Parent, rewrite: TextRewriter): void {
  const children = parent.children as Array<RootContent | PhrasingContent>;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) continue;
    if (child.type === "text") {
      const replacements = rewrite((child as Text).value);
      if (replacements) {
        children.splice(i, 1, ...replacements);
        i += replacements.length - 1;
      }
      continue;
    }
    if (child.type === "code" || child.type === "inlineCode" || child.type === "html") {
      continue;
    }
    if ("children" in child && Array.isArray((child as Parent).children)) {
      rewriteTextNodes(child as Parent, rewrite);
    }
  }
}
