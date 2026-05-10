import { resolve } from "node:path";
import { glob } from "tinyglobby";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";

export interface CollectOptions {
  vaultRoot: string;
  path: string;
  exclude: string[];
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
