import { getAllNotes } from "./notes.ts";
import { getGlossaryGroupedIndex } from "./glossary.ts";
import { getAllBooks, getBookCoverMap } from "./books.ts";
import type { FuriganaGroup } from "@/lib/glossary/groupByFurigana.ts";
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";
import { parentFolderName } from "@/lib/content/paths.ts";

// XxxIndexItem はページ (一覧・タグ別一覧) が表示するフィールドのみを持つ。
// XxxListItem はそれにタグ集計・フィルタ専用の tags を加えた投影で、loader は
// ページへ返す直前に omitTags で tags を取り除く (SSG では loader の戻り値が
// そのままページ HTML に埋め込まれるため)。

/** Notes の行 (NoteListRow) が使うフィールド。 */
export interface NoteIndexItem {
  slug: string;
  title: string;
  updated: string;
  /** Vault 内の直近の親フォルダ名。Vault 直下のノートは null。 */
  folder: string | null;
}

export interface NoteListItem extends NoteIndexItem {
  tags: string[];
}

/** Glossary の行 (GlossaryListRow) が使うフィールド。 */
export interface GlossaryIndexItem {
  slug: string;
  term: string;
  furigana: string | null;
  summary: string | null;
}

export interface GlossaryListItem extends GlossaryIndexItem {
  tags: string[];
}

export interface GlossaryGroupSectionDto {
  name: FuriganaGroup;
  items: GlossaryListItem[];
}

export interface GlossaryIndexSection {
  name: FuriganaGroup;
  items: GlossaryIndexItem[];
}

/** Books のタイル (BookTile) が使うフィールド。 */
export interface BookIndexItem {
  slug: string;
  title: string;
  authors: string[];
  readDate: string | null;
  coverUrl: string | null;
}

export interface BookListItem extends BookIndexItem {
  tags: string[];
}

/** タグ集計・フィルタ専用の tags を落とし、ページへ返す DTO にする。 */
export function omitTags<T extends { tags: string[] }>({
  tags: _tags,
  ...rest
}: T): Omit<T, "tags"> {
  return rest;
}

// index loaders と tag loaders で共有する素の投影ヘルパ。
// (createServerFn の handler は inline でなければならず、tag loaders は index の
// server fn を直接呼べないため、代わりにこれらのプリミティブを呼ぶ。)
export async function projectNotesIndex(): Promise<NoteListItem[]> {
  const notes = await getAllNotes();
  return notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    updated: note.frontmatter.updated,
    tags: note.frontmatter.tags ?? [],
    folder: parentFolderName(note.filePath),
  }));
}

export async function projectGlossaryIndex(): Promise<GlossaryGroupSectionDto[]> {
  const groups = await getGlossaryGroupedIndex();
  return groups.map((g) => ({
    name: g.name,
    items: g.items.map((term) => ({
      slug: term.slug,
      term: term.title,
      furigana: term.frontmatter.furigana ?? null,
      summary: term.frontmatter.summary ?? null,
      tags: term.frontmatter.tags ?? [],
    })),
  }));
}

export async function projectBooksIndex(): Promise<BookListItem[]> {
  const books = await getAllBooks();
  const covers = await getBookCoverMap();
  return books
    .map((book) => ({
      slug: book.slug,
      title: book.title,
      authors: book.frontmatter.authors,
      readDate: book.frontmatter.read_date ?? null,
      tags: book.frontmatter.tags ?? [],
      coverUrl: covers.get(book.slug) ?? null,
    }))
    .toSorted(
      // 読了日の新しい順。read_date を持たないものは ("" が最小値となり) 末尾へ。
      compareByUpdatedDesc<BookListItem>(
        (it) => it.readDate ?? "",
        (it) => it.slug,
      ),
    );
}
