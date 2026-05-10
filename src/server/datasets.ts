import type { RenderedBook, RenderedGlossaryTerm, RenderedNote } from "@/types/content.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import { resolveConfig } from "@/lib/config/index.ts";
import { collectBooks, collectGlossary, collectNotes } from "@/lib/content/index.ts";
import {
  pickBooksTitle,
  pickGlossaryTitle,
  pickNotesTitle,
  renderContentDrafts,
} from "@/lib/markdown/pipeline.ts";
import { buildContentIndex } from "@/lib/linkgraph/resolve.ts";
import { attachBacklinks, buildBacklinks } from "@/lib/linkgraph/graph.ts";
// Static import so the bundler embeds the config in the SSR bundle.
import siteConfigInput from "../../site.config.ts";
import {
  FURIGANA_GROUP_ORDER,
  groupByFurigana,
  type FuriganaGroup,
} from "@/lib/glossary/groupByFurigana.ts";

export interface SiteDataset {
  notes: RenderedNote[];
  glossary: RenderedGlossaryTerm[];
  books: RenderedBook[];
  bySlug: {
    notes: Map<string, RenderedNote>;
    glossary: Map<string, RenderedGlossaryTerm>;
    books: Map<string, RenderedBook>;
  };
}

let cached: Promise<SiteDataset> | null = null;
let configOverride: SiteConfigParsed | null = null;

async function build(): Promise<SiteDataset> {
  const config = configOverride ?? resolveConfig(siteConfigInput);

  const [notesItems, glossaryItems, booksItems] = await Promise.all([
    collectNotes(config),
    collectGlossary(config),
    collectBooks(config),
  ]);

  const allItems = [...notesItems, ...glossaryItems, ...booksItems];
  const index = buildContentIndex(allItems);

  const notesDrafts = await renderContentDrafts({
    items: notesItems,
    config,
    index,
    pickTitle: pickNotesTitle,
  });
  const glossaryDrafts = await renderContentDrafts({
    items: glossaryItems,
    config,
    index,
    pickTitle: pickGlossaryTitle,
  });
  const booksDrafts = await renderContentDrafts({
    items: booksItems,
    config,
    index,
    pickTitle: pickBooksTitle,
  });

  const allDrafts = [...notesDrafts, ...glossaryDrafts, ...booksDrafts];
  const backlinks = buildBacklinks(allDrafts);

  const notes = sortNotes(attachBacklinks(notesDrafts, backlinks));
  const glossary = sortGlossary(attachBacklinks(glossaryDrafts, backlinks));
  const books = sortBooks(attachBacklinks(booksDrafts, backlinks));

  return {
    notes,
    glossary,
    books,
    bySlug: {
      notes: indexBySlug(notes),
      glossary: indexBySlug(glossary),
      books: indexBySlug(books),
    },
  };
}

function indexBySlug<T extends { slug: string }>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.slug, item);
  return map;
}

function sortNotes(notes: readonly RenderedNote[]): RenderedNote[] {
  return notes.toSorted((a, b) => {
    if (a.frontmatter.updated === b.frontmatter.updated) {
      return a.slug.localeCompare(b.slug);
    }
    return a.frontmatter.updated < b.frontmatter.updated ? 1 : -1;
  });
}

function sortGlossary(items: readonly RenderedGlossaryTerm[]): RenderedGlossaryTerm[] {
  return items.toSorted((a, b) => {
    const af = a.frontmatter.furigana ?? "";
    const bf = b.frontmatter.furigana ?? "";
    if (af === bf) return a.title.localeCompare(b.title, "ja");
    if (af === "") return 1;
    if (bf === "") return -1;
    return af.localeCompare(bf, "ja");
  });
}

function sortBooks(items: readonly RenderedBook[]): RenderedBook[] {
  return items.toSorted((a, b) => {
    const ay = a.frontmatter.pubYear;
    const by = b.frontmatter.pubYear;
    if (ay === by) return a.title.localeCompare(b.title, "ja");
    if (ay === undefined) return 1;
    if (by === undefined) return -1;
    return by - ay;
  });
}

export function getSiteDataset(): Promise<SiteDataset> {
  if (cached === null) {
    const p = build();
    cached = p;
    p.catch(() => {
      if (cached === p) cached = null;
    });
  }
  return cached;
}

export function __resetSiteDatasetForTests(): void {
  cached = null;
  configOverride = null;
}

export function __setSiteDatasetConfigForTests(config: SiteConfigParsed): void {
  configOverride = config;
  cached = null;
}

export interface GlossaryGroupSection {
  name: FuriganaGroup;
  items: RenderedGlossaryTerm[];
}

export function groupGlossaryByFurigana(
  items: readonly RenderedGlossaryTerm[],
): GlossaryGroupSection[] {
  const buckets = new Map<FuriganaGroup, RenderedGlossaryTerm[]>();
  for (const item of items) {
    const group = groupByFurigana(item.frontmatter.furigana);
    const bucket = buckets.get(group);
    if (bucket) bucket.push(item);
    else buckets.set(group, [item]);
  }
  const out: GlossaryGroupSection[] = [];
  for (const name of FURIGANA_GROUP_ORDER) {
    const bucket = buckets.get(name);
    if (bucket && bucket.length > 0) out.push({ name, items: bucket });
  }
  return out;
}
