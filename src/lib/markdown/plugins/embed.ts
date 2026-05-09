import type { Blockquote, Link, Paragraph, Root, RootContent, Text } from "mdast";
import { BuildError } from "@/lib/content/errors.ts";
import type { ContentIndex } from "@/lib/linkgraph/resolve.ts";
import { resolveLinkTarget } from "@/lib/linkgraph/resolve.ts";
import type { OutgoingLink } from "@/types/content.ts";
import { isImagePath } from "./image-util.ts";
import { rewriteTextNodes } from "./wiki-link.ts";

const BLOCK_EMBED_RE = /^!\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]$/;

export interface EmbedContext {
  index: ContentIndex;
  fromFilePath: string;
  fromSlug: string;
  outgoing: OutgoingLink[];
  parsedBodies: Map<string, Root>;
}

export function applyEmbed(tree: Root, ctx: EmbedContext): void {
  const next: RootContent[] = [];
  for (const node of tree.children) {
    const embed = matchBlockEmbed(node);
    if (embed) {
      next.push(...expandEmbed(embed.target, embed.alias, ctx));
      continue;
    }
    next.push(node);
  }
  tree.children = next;
}

function matchBlockEmbed(node: RootContent): { target: string; alias: string | undefined } | null {
  if (node.type !== "paragraph") return null;
  if (node.children.length !== 1) return null;
  const child = node.children[0];
  if (!child || child.type !== "text") return null;
  const match = BLOCK_EMBED_RE.exec((child as Text).value.trim());
  if (!match) return null;
  return { target: match[1] ?? "", alias: match[2] };
}

function expandEmbed(
  rawTarget: string,
  alias: string | undefined,
  ctx: EmbedContext,
): RootContent[] {
  const target = rawTarget.trim();

  if (isImagePath(target)) {
    return [
      {
        type: "paragraph",
        children: [
          {
            type: "image",
            url: target,
            alt: alias?.trim() ?? "",
            title: null,
          },
        ],
      },
    ];
  }

  const resolved = resolveLinkTarget(ctx.index, {
    fromFilePath: ctx.fromFilePath,
    rawTarget,
  });
  if (!resolved) {
    return [
      {
        type: "paragraph",
        children: [{ type: "text", value: alias?.trim() ?? target }],
      },
    ];
  }

  if (resolved.item.slug === ctx.fromSlug) {
    throw new BuildError({
      category: "link-resolution",
      filePath: ctx.fromFilePath,
      message: `Circular embed: "${ctx.fromSlug}" embeds itself.`,
    });
  }

  ctx.outgoing.push({
    type: resolved.type,
    slug: resolved.item.slug,
    raw: rawTarget,
    embedded: true,
  });

  const body = ctx.parsedBodies.get(resolved.item.slug);
  if (!body) {
    return [
      {
        type: "paragraph",
        children: [{ type: "text", value: alias?.trim() ?? target }],
      },
    ];
  }

  const cloned = structuredClone(body) as Root;
  demoteEmbedsToLinks(cloned);

  const sourceLink: Link = {
    type: "link",
    url: `/${resolved.type}/${resolved.item.slug}`,
    title: null,
    children: [
      {
        type: "text",
        value: resolved.item.frontmatter.title ?? resolved.item.slug,
      },
    ],
  };
  const sourceParagraph: Paragraph = {
    type: "paragraph",
    data: { hProperties: { "data-embed-source": "true" } },
    children: [{ type: "text", value: "Source: " }, sourceLink],
  };

  const wrapped: Blockquote = {
    type: "blockquote",
    data: { hProperties: { "data-embed": "true" } },
    children: [...cloned.children, sourceParagraph] as Blockquote["children"],
  };

  return [wrapped];
}

function demoteEmbedsToLinks(tree: Root): void {
  rewriteTextNodes(tree, (value) => {
    if (!value.includes("![[")) return null;
    return [{ type: "text", value: value.replaceAll("![[", "[[") }];
  });
}
