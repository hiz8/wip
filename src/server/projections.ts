import { getAllNotes } from "./notes.ts";
import { getGlossaryGroupedIndex } from "./glossary.ts";
import { getAllBooks, getBookCoverMap } from "./books.ts";
import type { FuriganaGroup } from "@/lib/glossary/groupByFurigana.ts";
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";
import { parentFolderName } from "@/lib/content/paths.ts";

export interface NoteListItem {
  slug: string;
  title: string;
  updated: string;
  summary: string | null;
  tags: string[];
  /** Vault 内の直近の親フォルダ名。Vault 直下のノートは null。 */
  folder: string | null;
}

export interface GlossaryListItem {
  slug: string;
  term: string;
  furigana: string | null;
  summary: string | null;
  tags: string[];
  aliases: string[];
}

export interface GlossaryGroupSectionDto {
  name: FuriganaGroup;
  items: GlossaryListItem[];
}

export interface BookListItem {
  slug: string;
  title: string;
  authors: string[];
  pubYear: number | null;
  readDate: string | null;
  summary: string | null;
  tags: string[];
  coverUrl: string | null;
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
    summary: note.frontmatter.summary ?? null,
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
      aliases: term.frontmatter.aliases ?? [],
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
      pubYear: book.frontmatter.pubYear ?? null,
      readDate: book.frontmatter.read_date ?? null,
      summary: book.frontmatter.summary ?? null,
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
