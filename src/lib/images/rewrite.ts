const IMG_TAG_RE = /<img\b([^>]*?)\bsrc\s*=\s*(["'])([^"']*)\2([^>]*)>/giu;

export function rewriteImgSrcInHtml(
  html: string,
  rawToPublic: ReadonlyMap<string, string>,
): string {
  if (rawToPublic.size === 0) return html;
  return html.replace(
    IMG_TAG_RE,
    (whole, before: string, quote: string, src: string, after: string) => {
      const replacement = rawToPublic.get(src);
      if (replacement === undefined) return whole;
      return `<img${before}src=${quote}${replacement}${quote}${after}>`;
    },
  );
}
