import { describe, expect, it } from "vitest";
import {
  buildImageMapping,
  buildResolvedToPublicMap,
  hashSuffix,
  isExternalImagePath,
} from "@/lib/images/resolve.ts";

describe("isExternalImagePath", () => {
  it("flags http(s) and data URIs as external", () => {
    expect(isExternalImagePath("https://example.com/a.png")).toBe(true);
    expect(isExternalImagePath("http://example.com/a.png")).toBe(true);
    expect(isExternalImagePath("data:image/png;base64,AAA")).toBe(true);
    expect(isExternalImagePath("/abs/a.png")).toBe(false);
    expect(isExternalImagePath("rel/a.png")).toBe(false);
  });
});

describe("hashSuffix", () => {
  it("returns 8 lowercase hex characters", () => {
    expect(hashSuffix("/vault/a.png")).toMatch(/^[0-9a-f]{8}$/u);
  });

  it("is deterministic", () => {
    expect(hashSuffix("/vault/a.png")).toBe(hashSuffix("/vault/a.png"));
  });

  it("differs for different inputs", () => {
    expect(hashSuffix("/vault/a.png")).not.toBe(hashSuffix("/vault/b.png"));
  });
});

describe("buildImageMapping", () => {
  it("returns empty result for empty input", () => {
    expect(buildImageMapping([])).toEqual({ entries: [], conflicts: [] });
  });

  it("flattens unique basenames into /images/<basename>", () => {
    const result = buildImageMapping([
      { rawPath: "a/foo.png", resolvedAbsolutePath: "/vault/a/foo.png" },
      { rawPath: "b/bar.jpg", resolvedAbsolutePath: "/vault/b/bar.jpg" },
    ]);
    expect(result.entries).toEqual([
      { resolvedAbsolutePath: "/vault/a/foo.png", publicPath: "/images/foo.png" },
      { resolvedAbsolutePath: "/vault/b/bar.jpg", publicPath: "/images/bar.jpg" },
    ]);
    expect(result.conflicts).toEqual([]);
  });

  it("deduplicates entries that share resolvedAbsolutePath", () => {
    const result = buildImageMapping([
      { rawPath: "../assets/foo.png", resolvedAbsolutePath: "/vault/assets/foo.png" },
      { rawPath: "assets/foo.png", resolvedAbsolutePath: "/vault/assets/foo.png" },
    ]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]?.publicPath).toBe("/images/foo.png");
  });

  it("hashes both sides when the same basename resolves to different files", () => {
    const result = buildImageMapping([
      { rawPath: "a/icon.png", resolvedAbsolutePath: "/vault/a/icon.png" },
      { rawPath: "b/icon.png", resolvedAbsolutePath: "/vault/b/icon.png" },
    ]);
    expect(result.entries).toHaveLength(2);
    for (const entry of result.entries) {
      expect(entry.publicPath).toMatch(/^\/images\/icon-[0-9a-f]{8}\.png$/u);
    }
    expect(new Set(result.entries.map((e) => e.publicPath)).size).toBe(2);
    expect(result.conflicts).toEqual(["icon.png"]);
  });

  it("skips http(s) and data: references", () => {
    const result = buildImageMapping([
      { rawPath: "https://example.com/a.png", resolvedAbsolutePath: "https://example.com/a.png" },
      { rawPath: "data:image/png;base64,AAA", resolvedAbsolutePath: "data:image/png;base64,AAA" },
      { rawPath: "rel/keep.png", resolvedAbsolutePath: "/vault/rel/keep.png" },
    ]);
    expect(result.entries).toEqual([
      { resolvedAbsolutePath: "/vault/rel/keep.png", publicPath: "/images/keep.png" },
    ]);
  });

  it("handles a basename without an extension on collision", () => {
    const result = buildImageMapping([
      { rawPath: "a/diagram", resolvedAbsolutePath: "/vault/a/diagram" },
      { rawPath: "b/diagram", resolvedAbsolutePath: "/vault/b/diagram" },
    ]);
    for (const entry of result.entries) {
      expect(entry.publicPath).toMatch(/^\/images\/diagram-[0-9a-f]{8}$/u);
    }
  });
});

describe("buildResolvedToPublicMap", () => {
  it("turns entries into a lookup map", () => {
    const map = buildResolvedToPublicMap([
      { resolvedAbsolutePath: "/a", publicPath: "/images/a" },
      { resolvedAbsolutePath: "/b", publicPath: "/images/b" },
    ]);
    expect(map.get("/a")).toBe("/images/a");
    expect(map.get("/b")).toBe("/images/b");
    expect(map.get("/c")).toBeUndefined();
  });
});
