import { dirname, isAbsolute, resolve as resolvePath } from "node:path";
import type { ImageRef } from "@/types/content.ts";
import { isExternalImagePath } from "./resolve.ts";

export interface BookCoverContext {
  cover?: string;
  bookAbsolutePath: string;
  vaultRoot: string;
}

export function bookCoverToImageRef(ctx: BookCoverContext): ImageRef | null {
  const cover = ctx.cover?.trim();
  if (!cover) return null;
  if (isExternalImagePath(cover)) {
    return { rawPath: cover, resolvedAbsolutePath: cover };
  }
  if (cover.startsWith("/")) {
    return {
      rawPath: cover,
      resolvedAbsolutePath: resolvePath(ctx.vaultRoot, cover.slice(1)),
    };
  }
  if (isAbsolute(cover)) {
    return { rawPath: cover, resolvedAbsolutePath: cover };
  }
  return {
    rawPath: cover,
    resolvedAbsolutePath: resolvePath(dirname(ctx.bookAbsolutePath), cover),
  };
}

export function lookupBookCoverUrl(
  ctx: BookCoverContext,
  resolvedToPublic: ReadonlyMap<string, string>,
): string | null {
  const ref = bookCoverToImageRef(ctx);
  if (!ref) return null;
  if (isExternalImagePath(ref.rawPath)) return ref.rawPath;
  return resolvedToPublic.get(ref.resolvedAbsolutePath) ?? null;
}
