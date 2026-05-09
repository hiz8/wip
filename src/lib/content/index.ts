import type { ContentItem, NotesFrontmatter } from "@/types/content.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import { collectNoteFiles } from "./collect.ts";
import { parseMarkdownFile } from "./parse.ts";
import { isPublished, validateNotesFrontmatter } from "./validate.ts";
import { assertUniqueSlugs, deriveSlug } from "./slug.ts";

export { collectNoteFiles } from "./collect.ts";
export { parseMarkdownFile } from "./parse.ts";
export type { ParsedFile } from "./parse.ts";
export { validateNotesFrontmatter, isPublished } from "./validate.ts";
export { deriveSlug, assertUniqueSlugs } from "./slug.ts";
export { BuildError, formatBuildError } from "./errors.ts";
export type { BuildErrorCategory, BuildErrorDetails } from "./errors.ts";

export async function collectNotes(
  config: SiteConfigParsed,
): Promise<ContentItem<NotesFrontmatter>[]> {
  const files = await collectNoteFiles(config);
  const items: ContentItem<NotesFrontmatter>[] = [];

  for (const absolutePath of files) {
    const parsed = await parseMarkdownFile(absolutePath, config.content.vaultRoot);
    const frontmatter = validateNotesFrontmatter(parsed.rawFrontmatter, parsed.filePath);
    if (!isPublished(frontmatter)) continue;

    items.push({
      type: "notes",
      slug: deriveSlug(parsed.filePath),
      filePath: parsed.filePath,
      absolutePath: parsed.absolutePath,
      frontmatter,
      body: parsed.body,
    });
  }

  assertUniqueSlugs(items);
  return items;
}
