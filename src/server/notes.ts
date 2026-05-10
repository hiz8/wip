import type { RenderedNote } from "@/types/content.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import {
  __resetSiteDatasetForTests,
  __setSiteDatasetConfigForTests,
  getSiteDataset,
} from "./datasets.ts";

export interface NotesDataset {
  notes: RenderedNote[];
  bySlug: Map<string, RenderedNote>;
}

export async function getAllNotes(): Promise<RenderedNote[]> {
  const data = await getSiteDataset();
  return data.notes;
}

export async function getNoteBySlug(slug: string): Promise<RenderedNote | undefined> {
  const data = await getSiteDataset();
  return data.bySlug.notes.get(slug);
}

export function __resetNotesCacheForTests(): void {
  __resetSiteDatasetForTests();
}

export function __setConfigForTests(config: SiteConfigParsed): void {
  __setSiteDatasetConfigForTests(config);
}
