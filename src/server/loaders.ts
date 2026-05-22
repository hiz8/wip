import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAllNotes, getNoteBySlug } from "./notes.ts";
import { getAllGlossaryTerms, getGlossaryGroupedIndex, getGlossaryTermBySlug } from "./glossary.ts";
import { getAllBooks, getBookByIsbn, getBookCoverMap } from "./books.ts";
import { buildBooksTree } from "@/lib/tree/buildBooksTree.ts";
import { buildGlossaryTree } from "@/lib/tree/buildGlossaryTree.ts";
import { buildTreeFromRenderedNotes } from "@/lib/tree/buildTree.ts";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import type { FuriganaGroup } from "@/lib/glossary/groupByFurigana.ts";
import { aggregateTags, decodeTagSlug, filterByTag } from "@/lib/tags/index.ts";
import type { TagCount } from "@/lib/tags/index.ts";
import type { BacklinkRef, CalloutEntry, FootnoteEntry, TocEntry } from "@/types/content.ts";

export type { TagCount } from "@/lib/tags/index.ts";

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
  coverUrl: string | null;
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

// Plain projection helpers shared by the index loaders and the tag loaders.
// (createServerFn handlers must be inline, so the tag loaders cannot call the
// index server fns directly; they call these primitives instead.)
async function projectNotesIndex(): Promise<NoteListItem[]> {
  const notes = await getAllNotes();
  return notes.map((note) => ({
    slug: note.slug,
    title: note.title,
    updated: note.frontmatter.updated,
    summary: note.frontmatter.summary ?? null,
    tags: note.frontmatter.tags ?? [],
    featured: note.frontmatter.featured ?? false,
  }));
}

async function projectGlossaryIndex(): Promise<GlossaryGroupSectionDto[]> {
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

async function projectBooksIndex(): Promise<BookListItem[]> {
  const books = await getAllBooks();
  const covers = await getBookCoverMap();
  return books.map((book) => ({
    slug: book.slug,
    title: book.title,
    authors: book.frontmatter.authors,
    pubYear: book.frontmatter.pubYear ?? null,
    publisher: book.frontmatter.publisher ?? null,
    summary: book.frontmatter.summary ?? null,
    tags: book.frontmatter.tags ?? [],
    coverUrl: covers.get(book.slug) ?? null,
  }));
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

// Tags are namespaced per content type, so each type aggregates and filters its
// own items only; a tag slug carries `--` for the hierarchy separator (decoded here).
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
