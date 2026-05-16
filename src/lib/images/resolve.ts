import { createHash } from "node:crypto";
import { basename, dirname, extname, isAbsolute, resolve as resolvePath } from "node:path";
import type { ImageRef } from "@/types/content.ts";

export interface ImageMappingEntry {
  resolvedAbsolutePath: string;
  publicPath: string;
}

export interface ImageMappingResult {
  entries: ImageMappingEntry[];
  conflicts: string[];
}

const EXTERNAL_RE = /^(?:https?:|data:)/u;

export function isExternalImagePath(value: string): boolean {
  return EXTERNAL_RE.test(value);
}

export interface ResolveImageRefContext {
  rawPath: string;
  fromAbsolutePath: string;
  vaultRoot: string;
}

export function resolveImageRef(ctx: ResolveImageRefContext): ImageRef {
  const { rawPath, fromAbsolutePath, vaultRoot } = ctx;
  if (isExternalImagePath(rawPath)) {
    return { rawPath, resolvedAbsolutePath: rawPath };
  }
  if (rawPath.startsWith("/")) {
    return { rawPath, resolvedAbsolutePath: resolvePath(vaultRoot, rawPath.slice(1)) };
  }
  if (isAbsolute(rawPath)) {
    return { rawPath, resolvedAbsolutePath: rawPath };
  }
  return { rawPath, resolvedAbsolutePath: resolvePath(dirname(fromAbsolutePath), rawPath) };
}

export function hashSuffix(absolutePath: string): string {
  return createHash("sha1").update(absolutePath).digest("hex").slice(0, 8);
}

function buildPublicPath(absolutePath: string, withHash: boolean): string {
  const base = basename(absolutePath);
  if (!withHash) return `/images/${base}`;
  const ext = extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return `/images/${stem}-${hashSuffix(absolutePath)}${ext}`;
}

export function buildImageMapping(refs: readonly ImageRef[]): ImageMappingResult {
  const uniquePaths: string[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    if (isExternalImagePath(ref.rawPath) || isExternalImagePath(ref.resolvedAbsolutePath)) continue;
    if (seen.has(ref.resolvedAbsolutePath)) continue;
    seen.add(ref.resolvedAbsolutePath);
    uniquePaths.push(ref.resolvedAbsolutePath);
  }

  const groupedByBasename = new Map<string, string[]>();
  for (const absolutePath of uniquePaths) {
    const base = basename(absolutePath);
    const list = groupedByBasename.get(base) ?? [];
    list.push(absolutePath);
    groupedByBasename.set(base, list);
  }

  const entries: ImageMappingEntry[] = uniquePaths.map((resolvedAbsolutePath) => {
    const base = basename(resolvedAbsolutePath);
    const group = groupedByBasename.get(base) ?? [];
    return {
      resolvedAbsolutePath,
      publicPath: buildPublicPath(resolvedAbsolutePath, group.length > 1),
    };
  });

  const conflicts: string[] = [];
  for (const [base, group] of groupedByBasename) {
    if (group.length > 1) conflicts.push(base);
  }
  conflicts.sort((a, b) => a.localeCompare(b));

  return { entries, conflicts };
}

export function buildResolvedToPublicMap(
  entries: readonly ImageMappingEntry[],
): ReadonlyMap<string, string> {
  return new Map(entries.map((e) => [e.resolvedAbsolutePath, e.publicPath]));
}
