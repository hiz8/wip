import { resolve } from "node:path";
import { glob } from "tinyglobby";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import type { BaseFrontmatter, ContentItem, ContentType } from "@/types/content.ts";
import { parseMarkdownFile } from "./parse.ts";
import { assertUniqueSlugs, deriveSlug } from "./slug.ts";
import { isPublished } from "./validate.ts";

export interface CollectOptions {
  vaultRoot: string;
  path: string;
  exclude: string[];
}

export interface CollectContentSpec<F extends BaseFrontmatter> {
  type: ContentType;
  vaultRoot: string;
  path: string;
  exclude?: string[];
  validate: (raw: Record<string, unknown>, filePath: string) => F;
}

export function collectNoteFiles(config: SiteConfigParsed): Promise<string[]> {
  return collectMarkdownFiles({
    vaultRoot: config.content.vaultRoot,
    path: config.content.notes.path,
    exclude: config.content.notes.exclude,
  });
}

export async function collectMarkdownFiles(options: CollectOptions): Promise<string[]> {
  const baseDir = resolve(options.vaultRoot, options.path);
  const matches = await glob(["**/*.md"], {
    cwd: baseDir,
    ignore: options.exclude,
    absolute: true,
    dot: false,
    onlyFiles: true,
  });
  return matches.toSorted();
}

// Generic collection pipeline shared by Notes / Glossary / Books.
// Enumerates markdown files, parses frontmatter, runs the type-specific
// validator, drops non-published items, derives slugs, and verifies that
// slugs are unique within the type.
export async function collectContentItems<F extends BaseFrontmatter>(
  spec: CollectContentSpec<F>,
): Promise<ContentItem<F>[]> {
  const files = await collectMarkdownFiles({
    vaultRoot: spec.vaultRoot,
    path: spec.path,
    exclude: spec.exclude ?? [],
  });
  const items: ContentItem<F>[] = [];
  for (const absolutePath of files) {
    const parsed = await parseMarkdownFile(absolutePath, spec.vaultRoot);
    const frontmatter = spec.validate(parsed.rawFrontmatter, parsed.filePath);
    if (!isPublished(frontmatter)) continue;
    items.push({
      type: spec.type,
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
