import type {
  BaseFrontmatter,
  BooksFrontmatter,
  ContentItem,
  ContentType,
  GlossaryFrontmatter,
  NotesFrontmatter,
} from "@/types/content.ts";

// Cross-type title extraction from frontmatter only. Used by embed Source labels
// and any place that needs a stable display name without parsing the markdown.
const TITLE_FIELD: Record<ContentType, (fm: BaseFrontmatter) => string | undefined> = {
  notes: (fm) => (fm as NotesFrontmatter).title,
  glossary: (fm) => (fm as GlossaryFrontmatter).term,
  books: (fm) => (fm as BooksFrontmatter).aliases[0],
};

export function pickContentTitle(item: ContentItem<BaseFrontmatter>): string {
  const trimmed = TITLE_FIELD[item.type](item.frontmatter)?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : item.slug;
}
