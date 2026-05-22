/**
 * Tag utilities shared by the per-type tag routes.
 *
 * Tags are namespaced per content type (Notes / Glossary / Books); these helpers
 * operate on a flat list of items for a single type and never cross types.
 */

/** Anything carrying a list of tags. */
export interface Tagged {
  tags: readonly string[];
}

/** A tag paired with the number of items that match it (hierarchically). */
export interface TagCount {
  tag: string;
  count: number;
}

const SLUG_SEPARATOR = "--";
const HIERARCHY_SEPARATOR = "/";

/**
 * Encode a tag for use in a URL slug, escaping the hierarchy separator.
 *
 * `frontend/react` -> `frontend--react`.
 *
 * Known limitation: a tag whose name literally contains `--` does not round-trip.
 * Vault tags use `/` for hierarchy, so this is acceptable.
 */
export function encodeTagToSlug(tag: string): string {
  return tag.split(HIERARCHY_SEPARATOR).join(SLUG_SEPARATOR);
}

/** Inverse of {@link encodeTagToSlug}: `frontend--react` -> `frontend/react`. */
export function decodeTagSlug(slug: string): string {
  return slug.split(SLUG_SEPARATOR).join(HIERARCHY_SEPARATOR);
}

/**
 * Return the tag itself plus every ancestor along the hierarchy.
 *
 * `a/b/c` -> `["a", "a/b", "a/b/c"]`.
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
 * Whether an item's tag matches a filter tag, including descendants.
 *
 * Filtering by `frontend` matches both `frontend` and `frontend/react`.
 */
export function matchesTag(itemTag: string, filterTag: string): boolean {
  return itemTag === filterTag || itemTag.startsWith(`${filterTag}${HIERARCHY_SEPARATOR}`);
}

/**
 * Aggregate the distinct tags used across items, synthesizing ancestor tags so
 * that parent-only pages (e.g. `frontend` when only `frontend/react` is authored)
 * are reachable. Counts use hierarchical matching; sorted by count desc, then by
 * tag asc (locale-aware).
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

/** Filter items that carry the given tag (or any descendant of it). */
export function filterByTag<T extends Tagged>(items: readonly T[], tag: string): T[] {
  return items.filter((item) => item.tags.some((t) => matchesTag(t, tag)));
}
