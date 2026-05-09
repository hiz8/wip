import { basename, extname } from "node:path";
import type { ContentItem } from "@/types/content.ts";
import { BuildError } from "./errors.ts";

export function deriveSlug(filePath: string): string {
  const base = basename(filePath);
  const ext = extname(base);
  return ext ? base.slice(0, -ext.length) : base;
}

export function assertUniqueSlugs(items: ContentItem[]): void {
  const seen = new Map<string, ContentItem>();
  for (const item of items) {
    const existing = seen.get(item.slug);
    if (existing) {
      throw new BuildError({
        category: "slug-collision",
        filePath: item.filePath,
        message: `slug "${item.slug}" collides with ${existing.filePath}. Notes URLs are flat — rename one of the files.`,
      });
    }
    seen.set(item.slug, item);
  }
}
