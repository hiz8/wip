import { decodeTagSlug, encodeTagToSlug, tagAncestors } from "@/lib/tags/index.ts";

// Blog のタグ・ファセット集合モデル。
// 並び順はすべて Unicode コードポイント昇順 (localeCompare は使わない)。この順序が
// ファセット集合の正規形 (URL に用いる唯一の並び) を一意に決める (docs/blog-spec.md)。

const SET_SEPARATOR = "+";
const RESERVED_SEGMENT = "page";

export function compareCodePoints(a: string, b: string): number {
  const as = [...a];
  const bs = [...b];
  const len = Math.min(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const ca = as[i]!.codePointAt(0)!;
    const cb = bs[i]!.codePointAt(0)!;
    if (ca !== cb) return ca - cb;
  }
  return as.length - bs.length;
}

// トークン 1 個のバリデーション。違反があれば理由 (日本語メッセージ) を、なければ null を返す。
// URL 文法 (`+` = 集合区切り、`--` = 階層区切り、`page` = ページネーション) との衝突を弾く。
export function validateBlogTagToken(token: string): string | null {
  if (token === "") return "タグが空です";
  const segments = token.split("/");
  if (segments.length > 2) return `階層タグの深さは 2 までです (${token})`;
  for (const seg of segments) {
    if (seg === "") return `空のタグセグメントがあります (${token})`;
    if (seg.includes(SET_SEPARATOR)) return `タグセグメントに "+" は使えません (${token})`;
    if (seg.includes("--")) return `タグセグメントに "--" は使えません (${token})`;
    if (seg.startsWith("-") || seg.endsWith("-")) {
      return `タグセグメントを "-" で始める・終わることはできません (${token})`;
    }
    if (seg === RESERVED_SEGMENT)
      return `"page" は予約語のためタグセグメントに使えません (${token})`;
  }
  return null;
}

export function articleFacets(tokens: readonly string[]): string[] {
  const set = new Set<string>();
  for (const token of tokens) {
    for (const facet of tagAncestors(token)) set.add(facet);
  }
  return [...set].toSorted(compareCodePoints);
}

export function canonicalizeFacetSet(facets: Iterable<string>): string[] {
  const unique = [...new Set(facets)];
  // f が他の g の真プレフィックスなら f は冗長 (g が f を含意する)
  const kept = unique.filter((f) => !unique.some((g) => g.startsWith(`${f}/`)));
  return kept.toSorted(compareCodePoints);
}

export function canonicalFullFacetSet(tokens: readonly string[]): string[] {
  return canonicalizeFacetSet(articleFacets(tokens));
}

export function encodeTagset(canonicalFacets: readonly string[]): string {
  return canonicalFacets.map((f) => encodeTagToSlug(f)).join(SET_SEPARATOR);
}

export function decodeTagset(segment: string): string[] {
  return segment.split(SET_SEPARATOR).map((s) => decodeTagSlug(s));
}

export function canonicalTagsetOf(facets: Iterable<string>): string {
  return encodeTagset(canonicalizeFacetSet(facets));
}

export function facetSetSatisfies(
  facetSet: ReadonlySet<string>,
  pageFacets: readonly string[],
): boolean {
  return pageFacets.every((f) => facetSet.has(f));
}

// 記事の実質タイトル: 全ファセット集合の正規形を # 併記 (階層はフルパス)。
// feed エントリ・トップ「最近更新」・pickContentTitle のフォールバックで共用する。
export function blogArticleTitle(tokens: readonly string[]): string {
  return canonicalFullFacetSet(tokens)
    .map((f) => `#${f}`)
    .join("");
}
