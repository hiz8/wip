import type {
  BacklinkRef,
  BaseFrontmatter,
  NotesFrontmatter,
  RenderedItem,
  RenderedNote,
} from "@/types/content.ts";
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";

const compareBacklinkUpdatedDesc = compareByUpdatedDesc<BacklinkRef>(
  (ref) => ref.updated,
  (ref) => ref.slug,
);

export type RenderedItemDraft<F extends BaseFrontmatter = BaseFrontmatter> = Omit<
  RenderedItem<F>,
  "incomingLinks"
>;

// 既存のテストや利用側で使われる後方互換エイリアス。
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
    refs.sort(compareBacklinkUpdatedDesc);
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

// Notes 固有の型を期待する既存の呼び出し箇所を支えるための後方互換な特殊化。
export function attachBacklinksToNotes(
  drafts: readonly RenderedNoteDraft[],
  backlinks: Map<string, BacklinkRef[]>,
): RenderedNote[] {
  return attachBacklinks<NotesFrontmatter>(drafts, backlinks);
}
