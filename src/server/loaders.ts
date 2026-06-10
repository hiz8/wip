import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAllNotes, getNoteBySlug } from "./notes.ts";
import { getAllGlossaryTerms, getGlossaryTermBySlug } from "./glossary.ts";
import { getAllBooks, getBookByIsbn, getBookCoverMap } from "./books.ts";
import {
  parentFolderName,
  projectBooksIndex,
  projectGlossaryIndex,
  projectNotesIndex,
} from "./projections.ts";
import type {
  BookListItem,
  GlossaryGroupSectionDto,
  GlossaryListItem,
  NoteListItem,
} from "./projections.ts";
import { buildBooksTree } from "@/lib/tree/buildBooksTree.ts";
import { buildGlossaryTree } from "@/lib/tree/buildGlossaryTree.ts";
import { buildTreeFromRenderedNotes } from "@/lib/tree/buildTree.ts";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import { aggregateTags, decodeTagSlug, filterByTag } from "@/lib/tags/index.ts";
import type { TagCount } from "@/lib/tags/index.ts";
import type { BacklinkRef, CalloutEntry, FootnoteEntry, TocEntry } from "@/types/content.ts";

export type { TagCount } from "@/lib/tags/index.ts";
export type {
  BookListItem,
  GlossaryGroupSectionDto,
  GlossaryListItem,
  NoteListItem,
} from "./projections.ts";

export interface NoteDetail {
  slug: string;
  title: string;
  created: string;
  updated: string;
  tags: string[];
  summary: string | null;
  /** Vault 内の直近の親フォルダ名 (パンくず用)。Vault 直下のノートは null。 */
  folder: string | null;
  html: string;
  toc: TocEntry[];
  incomingLinks: BacklinkRef[];
  footnotes: FootnoteEntry[];
  callouts: CalloutEntry[];
}

export interface GlossaryDetail {
  slug: string;
  term: string;
  furigana: string | null;
  aliases: string[];
  tags: string[];
  summary: string | null;
  html: string;
  toc: TocEntry[];
  incomingLinks: BacklinkRef[];
  footnotes: FootnoteEntry[];
  callouts: CalloutEntry[];
}

export interface BookDetail {
  slug: string;
  isbn: string;
  title: string;
  authors: string[];
  pubYear: number | null;
  publisher: string | null;
  readDate: string | null;
  summary: string | null;
  tags: string[];
  coverUrl: string | null;
  html: string;
  toc: TocEntry[];
  incomingLinks: BacklinkRef[];
  footnotes: FootnoteEntry[];
  callouts: CalloutEntry[];
}

export const getNotesIndexData = createServerFn({ method: "GET" }).handler(
  (): Promise<NoteListItem[]> => projectNotesIndex(),
);

const noteSlugSchema = z.object({ slug: z.string().min(1) });

export const getNoteDetailData = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => noteSlugSchema.parse(value))
  .handler(async ({ data }): Promise<NoteDetail | null> => {
    const note = await getNoteBySlug(data.slug);
    if (!note) return null;
    return {
      slug: note.slug,
      title: note.title,
      created: note.frontmatter.created,
      updated: note.frontmatter.updated,
      tags: note.frontmatter.tags ?? [],
      summary: note.frontmatter.summary ?? null,
      folder: parentFolderName(note.filePath),
      html: note.html,
      toc: note.toc,
      incomingLinks: note.incomingLinks,
      footnotes: note.footnotes,
      callouts: note.callouts,
    };
  });

export const getNotesTreeData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TreeNode[]> => {
    const notes = await getAllNotes();
    return buildTreeFromRenderedNotes(notes);
  },
);

export const getGlossaryIndexData = createServerFn({ method: "GET" }).handler(
  (): Promise<GlossaryGroupSectionDto[]> => projectGlossaryIndex(),
);

const glossarySlugSchema = z.object({ slug: z.string().min(1) });

export const getGlossaryDetailData = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => glossarySlugSchema.parse(value))
  .handler(async ({ data }): Promise<GlossaryDetail | null> => {
    const term = await getGlossaryTermBySlug(data.slug);
    if (!term) return null;
    return {
      slug: term.slug,
      term: term.title,
      furigana: term.frontmatter.furigana ?? null,
      aliases: term.frontmatter.aliases ?? [],
      tags: term.frontmatter.tags ?? [],
      summary: term.frontmatter.summary ?? null,
      html: term.html,
      toc: term.toc,
      incomingLinks: term.incomingLinks,
      footnotes: term.footnotes,
      callouts: term.callouts,
    };
  });

export const getGlossaryTreeData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TreeNode[]> => {
    const terms = await getAllGlossaryTerms();
    return buildGlossaryTree(terms);
  },
);

export const getBooksIndexData = createServerFn({ method: "GET" }).handler(
  (): Promise<BookListItem[]> => projectBooksIndex(),
);

const bookIsbnSchema = z.object({ isbn: z.string().min(1) });

export const getBookDetailData = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => bookIsbnSchema.parse(value))
  .handler(async ({ data }): Promise<BookDetail | null> => {
    const book = await getBookByIsbn(data.isbn);
    if (!book) return null;
    const covers = await getBookCoverMap();
    return {
      slug: book.slug,
      isbn: book.frontmatter.isbn ?? book.slug,
      title: book.title,
      authors: book.frontmatter.authors,
      pubYear: book.frontmatter.pubYear ?? null,
      publisher: book.frontmatter.publisher ?? null,
      readDate: book.frontmatter.read_date ?? null,
      summary: book.frontmatter.summary ?? null,
      tags: book.frontmatter.tags ?? [],
      coverUrl: covers.get(book.slug) ?? null,
      html: book.html,
      toc: book.toc,
      incomingLinks: book.incomingLinks,
      footnotes: book.footnotes,
      callouts: book.callouts,
    };
  });

export const getBooksTreeData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TreeNode[]> => {
    const books = await getAllBooks();
    return buildBooksTree(books);
  },
);

// タグはコンテンツタイプごとに名前空間が分離されており、各タイプは自身の item
// だけを集計・フィルタする。tag slug は階層区切りを `--` で保持する (ここで decode)。
const tagSlugSchema = z.object({ tag: z.string().min(1) });

export const getNotesTagsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TagCount[]> => aggregateTags(await projectNotesIndex()),
);

export const getNotesByTagData = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => tagSlugSchema.parse(value))
  .handler(
    async ({ data }): Promise<NoteListItem[]> =>
      filterByTag(await projectNotesIndex(), decodeTagSlug(data.tag)),
  );

export const getGlossaryTagsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TagCount[]> => {
    const sections = await projectGlossaryIndex();
    return aggregateTags(sections.flatMap((section) => section.items));
  },
);

export const getGlossaryByTagData = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => tagSlugSchema.parse(value))
  .handler(async ({ data }): Promise<GlossaryListItem[]> => {
    const sections = await projectGlossaryIndex();
    return filterByTag(
      sections.flatMap((section) => section.items),
      decodeTagSlug(data.tag),
    );
  });

export const getBooksTagsData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TagCount[]> => aggregateTags(await projectBooksIndex()),
);

export const getBooksByTagData = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => tagSlugSchema.parse(value))
  .handler(
    async ({ data }): Promise<BookListItem[]> =>
      filterByTag(await projectBooksIndex(), decodeTagSlug(data.tag)),
  );
