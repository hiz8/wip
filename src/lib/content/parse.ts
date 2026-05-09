import { readFile } from "node:fs/promises";
import { relative } from "node:path";
import matter from "gray-matter";

export interface ParsedFile {
  absolutePath: string;
  filePath: string;
  rawFrontmatter: Record<string, unknown>;
  body: string;
}

export async function parseMarkdownFile(
  absolutePath: string,
  vaultRoot: string,
): Promise<ParsedFile> {
  const source = await readFile(absolutePath, "utf8");
  const parsed = matter(source);
  return {
    absolutePath,
    filePath: relative(vaultRoot, absolutePath),
    rawFrontmatter: (parsed.data ?? {}) as Record<string, unknown>,
    body: parsed.content,
  };
}
