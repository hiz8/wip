import { isExternalImagePath } from "./resolve.ts";

const IMG_TAG_RE = /<img\b([^>]*?)\bsrc\s*=\s*(["'])([^"']*)\2([^>]*)>/giu;

function decodeSrc(src: string): string {
  try {
    return decodeURIComponent(src);
  } catch {
    return src;
  }
}

export function rewriteImgSrcInHtml(
  html: string,
  rawToPublic: ReadonlyMap<string, string>,
): string {
  if (rawToPublic.size === 0) return html;
  return html.replace(
    IMG_TAG_RE,
    (whole, before: string, quote: string, src: string, after: string) => {
      // The map is keyed by the raw (decoded) path, but rehype URL-encodes the
      // src when serializing (e.g. spaces -> %20). Match the exact src first,
      // then fall back to its decoded form.
      const replacement = rawToPublic.get(src) ?? rawToPublic.get(decodeSrc(src));
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
