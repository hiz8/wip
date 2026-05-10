import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getAllNotes, getNoteBySlug } from "./notes.ts";
import { buildTreeFromRenderedNotes } from "@/lib/tree/buildTree.ts";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import type { BacklinkRef, TocEntry } from "@/types/content.ts";

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
    };
  });

export const getNotesTreeData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TreeNode[]> => {
    const notes = await getAllNotes();
    return buildTreeFromRenderedNotes(notes);
  },
);
