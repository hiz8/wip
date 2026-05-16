import type { ImageRef } from "@/types/content.ts";
import { isExternalImagePath, resolveImageRef } from "./resolve.ts";

export interface BookCoverContext {
  cover?: string;
  bookAbsolutePath: string;
  vaultRoot: string;
}

export function bookCoverToImageRef(ctx: BookCoverContext): ImageRef | null {
  const cover = ctx.cover?.trim();
  if (!cover) return null;
  return resolveImageRef({
    rawPath: cover,
    fromAbsolutePath: ctx.bookAbsolutePath,
    vaultRoot: ctx.vaultRoot,
  });
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
