import type {
  BaseFrontmatter,
  BooksFrontmatter,
  ContentItem,
  GlossaryFrontmatter,
  NotesFrontmatter,
} from "@/types/content.ts";

// Cross-type title extraction from frontmatter only. Used by embed Source labels
// and any place that needs a stable display name without parsing the markdown.
export function pickContentTitle(item: ContentItem<BaseFrontmatter>): string {
  if (item.type === "notes") {
    const f = item.frontmatter as NotesFrontmatter;
    const trimmed = f.title?.trim();
    if (trimmed && trimmed.length > 0) return trimmed;
    return item.slug;
  }
  if (item.type === "glossary") {
    const f = item.frontmatter as GlossaryFrontmatter;
    const trimmed = f.term?.trim();
    if (trimmed && trimmed.length > 0) return trimmed;
    return item.slug;
  }
  if (item.type === "books") {
    const f = item.frontmatter as BooksFrontmatter;
    const first = f.aliases[0]?.trim();
    if (first && first.length > 0) return first;
    return item.slug;
  }
  return item.slug;
}
