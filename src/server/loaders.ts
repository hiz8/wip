import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAllNotes, getNoteBySlug } from "./notes.ts";
import { getAllGlossaryTerms, getGlossaryGroupedIndex, getGlossaryTermBySlug } from "./glossary.ts";
import { getAllBooks, getBookByIsbn } from "./books.ts";
import { buildBooksTree } from "@/lib/tree/buildBooksTree.ts";
import { buildGlossaryTree } from "@/lib/tree/buildGlossaryTree.ts";
import { buildTreeFromRenderedNotes } from "@/lib/tree/buildTree.ts";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import type { FuriganaGroup } from "@/lib/glossary/groupByFurigana.ts";
import type { BacklinkRef, CalloutEntry, FootnoteEntry, TocEntry } from "@/types/content.ts";

export interface NoteListItem {
  slug: string;
  title: string;
  updated: string;
  summary: string | null;
  tags: string[];
  featured: boolean;
}

export interface NoteDetail {
  slug: string;
  title: string;
  created: string;
  updated: string;
  tags: string[];
  summary: string | null;
  html: string;
  toc: TocEntry[];
  incomingLinks: BacklinkRef[];
  footnotes: FootnoteEntry[];
  callouts: CalloutEntry[];
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

export interface BookListItem {
  slug: string;
  title: string;
  authors: string[];
  pubYear: number | null;
  publisher: string | null;
  summary: string | null;
  tags: string[];
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
  html: string;
  toc: TocEntry[];
  incomingLinks: BacklinkRef[];
  footnotes: FootnoteEntry[];
  callouts: CalloutEntry[];
}

export const getNotesIndexData = createServerFn({ method: "GET" }).handler(
  async (): Promise<NoteListItem[]> => {
    const notes = await getAllNotes();
    return notes.map((note) => ({
      slug: note.slug,
      title: note.title,
      updated: note.frontmatter.updated,
      summary: note.frontmatter.summary ?? null,
      tags: note.frontmatter.tags ?? [],
      featured: note.frontmatter.featured ?? false,
    }));
  },
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
  async (): Promise<GlossaryGroupSectionDto[]> => {
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
  },
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
  async (): Promise<BookListItem[]> => {
    const books = await getAllBooks();
    return books.map((book) => ({
      slug: book.slug,
      title: book.title,
      authors: book.frontmatter.authors,
      pubYear: book.frontmatter.pubYear ?? null,
      publisher: book.frontmatter.publisher ?? null,
      summary: book.frontmatter.summary ?? null,
      tags: book.frontmatter.tags ?? [],
    }));
  },
);

const bookIsbnSchema = z.object({ isbn: z.string().min(1) });

export const getBookDetailData = createServerFn({ method: "GET" })
  .inputValidator((value: unknown) => bookIsbnSchema.parse(value))
  .handler(async ({ data }): Promise<BookDetail | null> => {
    const book = await getBookByIsbn(data.isbn);
    if (!book) return null;
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
