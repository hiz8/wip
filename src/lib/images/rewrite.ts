import { isExternalImagePath } from "./resolve.ts";

const IMG_TAG_RE = /<img\b([^>]*?)\bsrc\s*=\s*(["'])([^"']*)\2([^>]*)>/giu;

function decodePercent(src: string): string {
  try {
    return decodeURIComponent(src);
  } catch {
    return src;
  }
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

// Reverses the HTML escaping that the serializer applies inside the src
// attribute (e.g. `&` -> `&amp;`). Handles the named entities a URL can
// contain plus numeric (decimal/hex) character references.
function decodeHtmlEntities(src: string): string {
  if (!src.includes("&")) return src;
  return src.replaceAll(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/giu, (whole, body: string) => {
    if (body.startsWith("#x") || body.startsWith("#X")) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isNaN(code) ? whole : String.fromCodePoint(code);
    }
    if (body.startsWith("#")) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isNaN(code) ? whole : String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

export function rewriteImgSrcInHtml(
  html: string,
  rawToPublic: ReadonlyMap<string, string>,
): string {
  if (rawToPublic.size === 0) return html;
  return html.replace(
    IMG_TAG_RE,
    (whole, before: string, quote: string, src: string, after: string) => {
      // The map is keyed by the raw (decoded) path, but the serializer escapes
      // the src: URL chars are percent-encoded (spaces -> %20) and `&` becomes
      // the `&amp;` entity. Try the exact src, then progressively undo each
      // layer of escaping so a raw key like `Q&A note.png` still matches.
      const entityDecoded = decodeHtmlEntities(src);
      const replacement =
        rawToPublic.get(src) ??
        rawToPublic.get(entityDecoded) ??
        rawToPublic.get(decodePercent(src)) ??
        rawToPublic.get(decodePercent(entityDecoded));
      if (replacement === undefined) return whole;
      return `<img${before}src=${quote}${replacement}${quote}${after}>`;
    },
  );
}

/**
 * Rewrites a rendered item's HTML so each in-content `<img src>` points at its
 * public path. Builds a per-item rawPath -> publicPath map from the item's own
 * `images` (external images are skipped) and applies it via rewriteImgSrcInHtml.
 *
 * `resolvedToPublic` is the global resolvedAbsolutePath -> publicPath mapping
 * (see buildResolvedToPublicMap). This is the single source of truth for the
 * src rewrite, shared by the SSR dataset build and post-build.
 */
export function rewriteItemHtml(
  html: string,
  images: ReadonlyArray<{ rawPath: string; resolvedAbsolutePath: string }>,
  resolvedToPublic: ReadonlyMap<string, string>,
): string {
  const map = new Map<string, string>();
  for (const img of images) {
    if (isExternalImagePath(img.rawPath)) continue;
    const publicPath = resolvedToPublic.get(img.resolvedAbsolutePath);
    if (publicPath !== undefined) map.set(img.rawPath, publicPath);
  }
  if (map.size === 0) return html;
  return rewriteImgSrcInHtml(html, map);
}
