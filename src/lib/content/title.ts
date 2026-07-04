import type {
  BaseFrontmatter,
  BlogFrontmatter,
  BooksFrontmatter,
  ContentItem,
  ContentType,
  GlossaryFrontmatter,
  NotesFrontmatter,
} from "@/types/content.ts";
import { blogArticleTitle } from "@/lib/blog/tagset.ts";

// frontmatter のみからの cross-type なタイトル抽出。embed の Source ラベルや、
// markdown をパースせず安定した表示名が必要な箇所で使われる。
// blog はリンク解決インデックスに登録されないため embed の Source ラベルで
// 実際に呼ばれることはないが、網羅性のため分岐を用意する。
const TITLE_FIELD: Record<ContentType, (fm: BaseFrontmatter) => string | undefined> = {
  notes: (fm) => (fm as NotesFrontmatter).title,
  glossary: (fm) => (fm as GlossaryFrontmatter).term,
  books: (fm) => (fm as BooksFrontmatter).aliases[0],
  blog: (fm) => blogArticleTitle((fm as BlogFrontmatter).tags ?? []),
};

export function pickContentTitle(item: ContentItem<BaseFrontmatter>): string {
  const trimmed = TITLE_FIELD[item.type](item.frontmatter)?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : item.slug;
}
