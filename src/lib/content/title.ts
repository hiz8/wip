import type {
  BaseFrontmatter,
  BooksFrontmatter,
  ContentItem,
  ContentType,
  GlossaryFrontmatter,
  NotesFrontmatter,
} from "@/types/content.ts";

// frontmatter のみからの cross-type なタイトル抽出。embed の Source ラベルや、
// markdown をパースせず安定した表示名が必要な箇所で使われる。
const TITLE_FIELD: Record<ContentType, (fm: BaseFrontmatter) => string | undefined> = {
  notes: (fm) => (fm as NotesFrontmatter).title,
  glossary: (fm) => (fm as GlossaryFrontmatter).term,
  books: (fm) => (fm as BooksFrontmatter).aliases[0],
};

export function pickContentTitle(item: ContentItem<BaseFrontmatter>): string {
  const trimmed = TITLE_FIELD[item.type](item.frontmatter)?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : item.slug;
}
