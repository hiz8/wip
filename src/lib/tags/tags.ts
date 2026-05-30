/**
 * タイプ別タグルートで共有されるタグ用ユーティリティ。
 *
 * タグはコンテンツタイプ (Notes / Glossary / Books) ごとに名前空間が分離される。
 * これらのヘルパは単一タイプの item のフラットなリストに対して動作し、タイプを
 * またぐことはない。
 */

/** タグのリストを持つ任意のもの。 */
export interface Tagged {
  tags: readonly string[];
}

/** タグと、それに (階層的に) 一致する item の数を組にしたもの。 */
export interface TagCount {
  tag: string;
  count: number;
}

const SLUG_SEPARATOR = "--";
const HIERARCHY_SEPARATOR = "/";

/**
 * 階層区切りをエスケープして、タグを URL slug 用にエンコードする。
 *
 * `frontend/react` -> `frontend--react`。
 *
 * 既知の制約: 名前に文字どおり `--` を含むタグは round-trip しない。Vault の
 * タグは階層に `/` を使うため、これは許容できる。
 */
export function encodeTagToSlug(tag: string): string {
  return tag.split(HIERARCHY_SEPARATOR).join(SLUG_SEPARATOR);
}

/** {@link encodeTagToSlug} の逆: `frontend--react` -> `frontend/react`。 */
export function decodeTagSlug(slug: string): string {
  return slug.split(SLUG_SEPARATOR).join(HIERARCHY_SEPARATOR);
}

/**
 * タグ自身に加え、階層に沿ったすべての祖先を返す。
 *
 * `a/b/c` -> `["a", "a/b", "a/b/c"]`。
 */
export function tagAncestors(tag: string): string[] {
  const segments = tag.split(HIERARCHY_SEPARATOR);
  const result: string[] = [];
  let prefix = "";
  for (const segment of segments) {
    prefix = prefix === "" ? segment : `${prefix}${HIERARCHY_SEPARATOR}${segment}`;
    result.push(prefix);
  }
  return result;
}

/**
 * item のタグが、子孫を含めてフィルタタグに一致するかどうか。
 *
 * `frontend` でフィルタすると `frontend` と `frontend/react` の両方に一致する。
 */
export function matchesTag(itemTag: string, filterTag: string): boolean {
  return itemTag === filterTag || itemTag.startsWith(`${filterTag}${HIERARCHY_SEPARATOR}`);
}

/**
 * item 全体で使われている異なるタグを集計し、祖先タグを合成することで、親のみの
 * ページ (例: `frontend/react` だけが書かれているときの `frontend`) に到達できる
 * ようにする。カウントは階層的な一致を用いる。count 降順、次に tag 昇順
 * (ロケール対応) でソートする。
 */
export function aggregateTags(items: ReadonlyArray<Tagged>): TagCount[] {
  const candidates = new Set<string>();
  for (const item of items) {
    for (const tag of item.tags) {
      for (const ancestor of tagAncestors(tag)) {
        candidates.add(ancestor);
      }
    }
  }

  const counts: TagCount[] = [];
  for (const tag of candidates) {
    let count = 0;
    for (const item of items) {
      if (item.tags.some((t) => matchesTag(t, tag))) {
        count += 1;
      }
    }
    counts.push({ tag, count });
  }

  counts.sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  return counts;
}

/** 指定したタグ (またはその任意の子孫) を持つ item をフィルタする。 */
export function filterByTag<T extends Tagged>(items: readonly T[], tag: string): T[] {
  return items.filter((item) => item.tags.some((t) => matchesTag(t, tag)));
}
