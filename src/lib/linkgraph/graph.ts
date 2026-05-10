import type {
  BacklinkRef,
  BaseFrontmatter,
  NotesFrontmatter,
  RenderedItem,
  RenderedNote,
} from "@/types/content.ts";

export type RenderedItemDraft<F extends BaseFrontmatter = BaseFrontmatter> = Omit<
  RenderedItem<F>,
  "incomingLinks"
>;

// Backwards-compatible alias used by existing tests and consumers.
export type RenderedNoteDraft = RenderedItemDraft<NotesFrontmatter>;

export function buildBacklinks(
  drafts: readonly RenderedItemDraft<BaseFrontmatter>[],
): Map<string, BacklinkRef[]> {
  const result = new Map<string, BacklinkRef[]>();

  for (const source of drafts) {
    const dedupedTargets = new Set<string>();
    for (const link of source.outgoingLinks) {
      const key = `${link.type}:${link.slug}`;
      if (dedupedTargets.has(key)) continue;
      dedupedTargets.add(key);

      const ref: BacklinkRef = {
        type: source.type,
        slug: source.slug,
        title: source.title,
        updated: source.frontmatter.updated ?? "",
      };

      const bucket = result.get(key);
      if (bucket) {
        bucket.push(ref);
      } else {
        result.set(key, [ref]);
      }
    }
  }

  for (const refs of result.values()) {
    refs.sort(compareUpdatedDesc);
  }

  return result;
}

export function attachBacklinks<F extends BaseFrontmatter>(
  drafts: readonly RenderedItemDraft<F>[],
  backlinks: Map<string, BacklinkRef[]>,
): RenderedItem<F>[] {
  return drafts.map((draft) => {
    const key = `${draft.type}:${draft.slug}`;
    const incoming = backlinks.get(key) ?? [];
    return {
      ...draft,
      incomingLinks: incoming,
    } as RenderedItem<F>;
  });
}

// Backwards-compatible specialization to support existing call sites that
// expect the Notes-specific types.
export function attachBacklinksToNotes(
  drafts: readonly RenderedNoteDraft[],
  backlinks: Map<string, BacklinkRef[]>,
): RenderedNote[] {
  return attachBacklinks<NotesFrontmatter>(drafts, backlinks);
}

function compareUpdatedDesc(a: BacklinkRef, b: BacklinkRef): number {
  if (a.updated === b.updated) return a.slug.localeCompare(b.slug);
  return a.updated < b.updated ? 1 : -1;
}
