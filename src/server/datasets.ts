import type {
  ImageRef,
  RenderedBook,
  RenderedGlossaryTerm,
  RenderedNote,
} from "@/types/content.ts";
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
import { compareByUpdatedDesc } from "@/lib/content/sort.ts";
import {
  buildImageMapping,
  buildResolvedToPublicMap,
  bookCoverToImageRef,
  isExternalImagePath,
  rewriteItemHtml,
  type ImageMappingEntry,
} from "@/lib/images/index.ts";
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
  imageMapping: readonly ImageMappingEntry[];
  coverBySlug: ReadonlyMap<string, string>;
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

  const { imageMapping, coverBySlug } = computeImageArtifacts(
    notes,
    glossary,
    books,
    config.content.vaultRoot,
  );

  // Rewrite in-content <img src> from rawPath to publicPath. This is the single
  // source of truth for the src rewrite, so the same HTML is served in dev (via
  // the dev images middleware) and in prod (prerendered output). Book cover URLs
  // already use publicPath via coverBySlug, so they are not handled here.
  const resolvedToPublic = buildResolvedToPublicMap(imageMapping);
  const rewriteHtml = <T extends { html: string; images: ImageRef[] }>(item: T): T => ({
    ...item,
    html: rewriteItemHtml(item.html, item.images, resolvedToPublic),
  });
  const notesRewritten = notes.map((item) => rewriteHtml(item));
  const glossaryRewritten = glossary.map((item) => rewriteHtml(item));
  const booksRewritten = books.map((item) => rewriteHtml(item));

  return {
    notes: notesRewritten,
    glossary: glossaryRewritten,
    books: booksRewritten,
    bySlug: {
      notes: indexBySlug(notesRewritten),
      glossary: indexBySlug(glossaryRewritten),
      books: indexBySlug(booksRewritten),
    },
    imageMapping,
    coverBySlug,
  };
}

function computeImageArtifacts(
  notes: readonly RenderedNote[],
  glossary: readonly RenderedGlossaryTerm[],
  books: readonly RenderedBook[],
  vaultRoot: string,
): { imageMapping: readonly ImageMappingEntry[]; coverBySlug: ReadonlyMap<string, string> } {
  const refs: ImageRef[] = [];
  for (const item of notes) refs.push(...item.images);
  for (const item of glossary) refs.push(...item.images);
  for (const item of books) refs.push(...item.images);

  const bookCoverRefs: Array<{ slug: string; ref: ImageRef }> = [];
  for (const book of books) {
    const cover = book.frontmatter.cover;
    if (cover === undefined) continue;
    const ref = bookCoverToImageRef({
      cover,
      bookAbsolutePath: book.absolutePath,
      vaultRoot,
    });
    if (ref === null) continue;
    refs.push(ref);
    bookCoverRefs.push({ slug: book.slug, ref });
  }

  const { entries } = buildImageMapping(refs);
  const resolvedToPublic = buildResolvedToPublicMap(entries);

  const coverBySlug = new Map<string, string>();
  for (const { slug, ref } of bookCoverRefs) {
    const url = isExternalImagePath(ref.rawPath)
      ? ref.rawPath
      : (resolvedToPublic.get(ref.resolvedAbsolutePath) ?? null);
    if (url !== null) coverBySlug.set(slug, url);
  }

  return { imageMapping: entries, coverBySlug };
}

function indexBySlug<T extends { slug: string }>(items: readonly T[]): Map<string, T> {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.slug, item);
  return map;
}

const compareNoteUpdatedDesc = compareByUpdatedDesc<RenderedNote>(
  (n) => n.frontmatter.updated,
  (n) => n.slug,
);

function sortNotes(notes: readonly RenderedNote[]): RenderedNote[] {
  return notes.toSorted(compareNoteUpdatedDesc);
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
