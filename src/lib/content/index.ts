import type {
  BooksFrontmatter,
  ContentItem,
  GlossaryFrontmatter,
  NotesFrontmatter,
} from "@/types/content.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import { collectContentItems } from "./collect.ts";
import {
  validateBooksFrontmatter,
  validateGlossaryFrontmatter,
  validateNotesFrontmatter,
} from "./validate.ts";

export { collectContentItems, collectMarkdownFiles, collectNoteFiles } from "./collect.ts";
export type { CollectContentSpec, CollectOptions } from "./collect.ts";
export { parseMarkdownFile } from "./parse.ts";
export type { ParsedFile } from "./parse.ts";
export {
  isPublished,
  validateBooksFrontmatter,
  validateGlossaryFrontmatter,
  validateNotesFrontmatter,
} from "./validate.ts";
export { assertUniqueSlugs, deriveSlug } from "./slug.ts";
export { pickContentTitle } from "./title.ts";
export { BuildError, formatBuildError } from "./errors.ts";
export type { BuildErrorCategory, BuildErrorDetails } from "./errors.ts";
export { compareByUpdatedDesc } from "./sort.ts";

export function collectNotes(config: SiteConfigParsed): Promise<ContentItem<NotesFrontmatter>[]> {
  return collectContentItems<NotesFrontmatter>({
    type: "notes",
    vaultRoot: config.content.vaultRoot,
    path: config.content.notes.path,
    exclude: config.content.notes.exclude,
    validate: validateNotesFrontmatter,
  });
}

export function collectGlossary(
  config: SiteConfigParsed,
): Promise<ContentItem<GlossaryFrontmatter>[]> {
  return collectContentItems<GlossaryFrontmatter>({
    type: "glossary",
    vaultRoot: config.content.vaultRoot,
    path: config.content.glossary.path,
    validate: validateGlossaryFrontmatter,
  });
}

export function collectBooks(config: SiteConfigParsed): Promise<ContentItem<BooksFrontmatter>[]> {
  return collectContentItems<BooksFrontmatter>({
    type: "books",
    vaultRoot: config.content.vaultRoot,
    path: config.content.books.path,
    validate: validateBooksFrontmatter,
  });
}
