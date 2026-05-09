import type { RenderedNote } from "@/types/content.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import { resolveConfig } from "@/lib/config/index.ts";
import { collectNotes } from "@/lib/content/index.ts";
import { renderNotes } from "@/lib/markdown/index.ts";
// Static import so the bundler embeds the config in the SSR bundle.
// Loading site.config.ts dynamically at runtime fails because Node cannot
// import a TypeScript module from a JavaScript build artifact.
import siteConfigInput from "../../site.config.ts";

export interface NotesDataset {
  notes: RenderedNote[];
  bySlug: Map<string, RenderedNote>;
}

let cached: Promise<NotesDataset> | null = null;
let configOverride: SiteConfigParsed | null = null;

function loadResolvedConfig(): SiteConfigParsed {
  return resolveConfig(siteConfigInput);
}

async function build(): Promise<NotesDataset> {
  const config = configOverride ?? loadResolvedConfig();
  const items = await collectNotes(config);
  const rendered = await renderNotes(items, config);

  const sorted = [...rendered].sort((a, b) =>
    a.frontmatter.updated < b.frontmatter.updated ? 1 : -1,
  );

  const bySlug = new Map<string, RenderedNote>();
  for (const note of sorted) {
    bySlug.set(note.slug, note);
  }

  return { notes: sorted, bySlug };
}

function dataset(): Promise<NotesDataset> {
  if (cached === null) {
    cached = build();
  }
  return cached;
}

export async function getAllNotes(): Promise<RenderedNote[]> {
  const data = await dataset();
  return data.notes;
}

export async function getNoteBySlug(slug: string): Promise<RenderedNote | undefined> {
  const data = await dataset();
  return data.bySlug.get(slug);
}

// Test-only helpers. Production callers should rely on the cached dataset.
export function __resetNotesCacheForTests(): void {
  cached = null;
  configOverride = null;
}

export function __setConfigForTests(config: SiteConfigParsed): void {
  configOverride = config;
  cached = null;
}
