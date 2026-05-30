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

// シリアライザが src 属性内に適用する HTML エスケープ (例: `&` -> `&amp;`) を
// 元に戻す。URL が含みうる名前付き実体に加え、数値 (10 進/16 進) 文字参照も
// 扱う。
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
      // map のキーは raw (デコード済み) のパスだが、シリアライザは src を
      // エスケープする: URL 文字はパーセントエンコードされ (空白 -> %20)、`&` は
      // `&amp;` 実体になる。まず src をそのまま試し、次にエスケープの各レイヤーを
      // 順に元に戻していくことで、`Q&A note.png` のような raw キーでも一致する。
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
 * レンダリング済み item の HTML を書き換え、コンテンツ内の各 `<img src>` がその
 * public path を指すようにする。item 自身の `images` から item ごとの
 * rawPath -> publicPath マップを構築し (外部画像はスキップ)、
 * rewriteImgSrcInHtml 経由で適用する。
 *
 * `resolvedToPublic` はグローバルな resolvedAbsolutePath -> publicPath の対応
 * (buildResolvedToPublicMap を参照)。これは src 書き換えの単一の情報源であり、
 * SSR dataset ビルドと post-build で共有される。
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
