import { dirname, isAbsolute, resolve as resolvePath } from "node:path";
import type { Image, PhrasingContent, Root } from "mdast";
import { visit } from "unist-util-visit";
import type { ImageRef } from "@/types/content.ts";
import { rewriteTextNodes } from "./wiki-link.ts";
import { isImagePath } from "./image-util.ts";

const INLINE_IMAGE_EMBED_RE = /!\[\[([^\]\n|]+)(?:\|([^\]\n]+))?\]\]/g;

export interface ImageContext {
  fromAbsolutePath: string;
  vaultRoot: string;
  images: ImageRef[];
}

export function applyImage(tree: Root, ctx: ImageContext): void {
  rewriteTextNodes(tree, (value) => splitInlineImageEmbeds(value));
  visit(tree, "image", (node) => {
    ctx.images.push(toImageRef(node, ctx));
  });
}

function splitInlineImageEmbeds(value: string): PhrasingContent[] | null {
  if (!value.includes("![[")) return null;
  const matches = [...value.matchAll(INLINE_IMAGE_EMBED_RE)].filter((match) =>
    isImagePath(match[1] ?? ""),
  );
  if (matches.length === 0) return null;

  const out: PhrasingContent[] = [];
  let cursor = 0;
  for (const match of matches) {
    const start = match.index ?? 0;
    if (start > cursor) {
      out.push({ type: "text", value: value.slice(cursor, start) });
    }
    const url = (match[1] ?? "").trim();
    const alt = match[2]?.trim() ?? "";
    out.push({ type: "image", url, alt, title: null });
    cursor = start + match[0].length;
  }
  if (cursor < value.length) {
    out.push({ type: "text", value: value.slice(cursor) });
  }
  return out;
}

function toImageRef(node: Image, ctx: ImageContext): ImageRef {
  const url = node.url;
  if (/^https?:\/\//.test(url) || url.startsWith("data:")) {
    return { rawPath: url, resolvedAbsolutePath: url };
  }
  if (url.startsWith("/")) {
    return {
      rawPath: url,
      resolvedAbsolutePath: resolvePath(ctx.vaultRoot, url.slice(1)),
    };
  }
  if (isAbsolute(url)) {
    return { rawPath: url, resolvedAbsolutePath: url };
  }
  return {
    rawPath: url,
    resolvedAbsolutePath: resolvePath(dirname(ctx.fromAbsolutePath), url),
  };
}
