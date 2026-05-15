import { describe, expect, it } from "vitest";
import { bookCoverToImageRef, lookupBookCoverUrl } from "@/lib/images/cover.ts";

const ctx = (cover?: string) => {
  if (cover === undefined) {
    return { bookAbsolutePath: "/vault/Books/9784xxx.md", vaultRoot: "/vault" };
  }
  return { cover, bookAbsolutePath: "/vault/Books/9784xxx.md", vaultRoot: "/vault" };
};

describe("bookCoverToImageRef", () => {
  it("returns null when cover is undefined or empty", () => {
    expect(bookCoverToImageRef(ctx())).toBeNull();
    expect(bookCoverToImageRef(ctx(""))).toBeNull();
    expect(bookCoverToImageRef(ctx("   "))).toBeNull();
  });

  it("resolves vault-rooted paths (leading slash) against vaultRoot", () => {
    expect(bookCoverToImageRef(ctx("/_assets/sample.png"))).toEqual({
      rawPath: "/_assets/sample.png",
      resolvedAbsolutePath: "/vault/_assets/sample.png",
    });
  });

  it("resolves bare relative paths against the book's directory", () => {
    expect(bookCoverToImageRef(ctx("covers/sample.png"))).toEqual({
      rawPath: "covers/sample.png",
      resolvedAbsolutePath: "/vault/Books/covers/sample.png",
    });
  });

  it("keeps absolute filesystem paths as-is", () => {
    expect(bookCoverToImageRef(ctx("/other/abs.png"))).toEqual({
      rawPath: "/other/abs.png",
      resolvedAbsolutePath: "/vault/other/abs.png",
    });
  });

  it("returns the same external URL on both fields", () => {
    expect(bookCoverToImageRef(ctx("https://example.com/cover.png"))).toEqual({
      rawPath: "https://example.com/cover.png",
      resolvedAbsolutePath: "https://example.com/cover.png",
    });
  });
});

describe("lookupBookCoverUrl", () => {
  it("returns null when cover is missing", () => {
    expect(lookupBookCoverUrl(ctx(), new Map())).toBeNull();
  });

  it("returns the public path when the resolved cover exists in the mapping", () => {
    const map = new Map([["/vault/Books/covers/sample.png", "/images/sample.png"]]);
    expect(lookupBookCoverUrl(ctx("covers/sample.png"), map)).toBe("/images/sample.png");
  });

  it("returns null when the resolved cover is missing from the mapping", () => {
    expect(lookupBookCoverUrl(ctx("covers/missing.png"), new Map())).toBeNull();
  });

  it("returns the external URL as-is", () => {
    expect(lookupBookCoverUrl(ctx("https://example.com/cover.png"), new Map())).toBe(
      "https://example.com/cover.png",
    );
  });
});
