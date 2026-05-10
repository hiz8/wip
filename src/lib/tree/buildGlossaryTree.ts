import {
  FURIGANA_GROUP_ORDER,
  groupByFurigana,
  type FuriganaGroup,
} from "@/lib/glossary/groupByFurigana.ts";
import type { RenderedGlossaryTerm } from "@/types/content.ts";
import type { TreeFolderNode, TreeNode, TreeNoteNode } from "./buildTree.ts";

interface GlossaryGroupBucket {
  group: FuriganaGroup;
  items: RenderedGlossaryTerm[];
}

export function buildGlossaryTree(items: readonly RenderedGlossaryTerm[]): TreeNode[] {
  const buckets = new Map<FuriganaGroup, GlossaryGroupBucket>();

  for (const item of items) {
    const group = groupByFurigana(item.frontmatter.furigana);
    const bucket = buckets.get(group);
    if (bucket) {
      bucket.items.push(item);
    } else {
      buckets.set(group, { group, items: [item] });
    }
  }

  const out: TreeNode[] = [];
  for (const group of FURIGANA_GROUP_ORDER) {
    const bucket = buckets.get(group);
    if (!bucket) continue;
    const sortedItems = bucket.items.toSorted(compareGlossary);
    const folder: TreeFolderNode = {
      kind: "folder",
      id: `group:${group}`,
      name: group,
      path: `glossary/group/${group}`,
      children: sortedItems.map((item) => toLeaf(item)),
    };
    out.push(folder);
  }

  return out;
}

function toLeaf(item: RenderedGlossaryTerm): TreeNoteNode {
  return {
    kind: "note",
    id: `glossary:${item.slug}`,
    slug: item.slug,
    title: item.title || item.slug,
    path: `glossary/${item.slug}`,
  };
}

function compareGlossary(a: RenderedGlossaryTerm, b: RenderedGlossaryTerm): number {
  const af = a.frontmatter.furigana ?? "";
  const bf = b.frontmatter.furigana ?? "";
  const fcmp = af.localeCompare(bf, "ja");
  if (fcmp !== 0) {
    if (af === "") return 1;
    if (bf === "") return -1;
    return fcmp;
  }
  return a.title.localeCompare(b.title, "ja");
}
