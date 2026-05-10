import type { RenderedBook } from "@/types/content.ts";
import type { TreeNode, TreeNoteNode } from "./buildTree.ts";

export function buildBooksTree(items: readonly RenderedBook[]): TreeNode[] {
  const sorted = items.toSorted(compareBooks);
  return sorted.map(
    (item): TreeNoteNode => ({
      kind: "note",
      id: `books:${item.slug}`,
      slug: item.slug,
      title: item.title || item.slug,
      path: `books/${item.slug}`,
    }),
  );
}

function compareBooks(a: RenderedBook, b: RenderedBook): number {
  const ay = a.frontmatter.pubYear;
  const by = b.frontmatter.pubYear;
  if (ay !== by) {
    if (ay === undefined) return 1;
    if (by === undefined) return -1;
    return by - ay;
  }
  return a.title.localeCompare(b.title, "ja");
}
