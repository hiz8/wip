import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import {
  __resetNotesCacheForTests,
  __setConfigForTests,
  getAllNotes,
  getNoteBySlug,
} from "@/server/notes.ts";

const fixturesDir = fileURLToPath(new URL("../fixtures", import.meta.url));

function makeConfig(vaultRelative: string): SiteConfigParsed {
  return {
    site: {
      name: "Test",
      description: "",
      url: "https://example.test",
      locale: "ja",
    },
    author: { name: "Tester" },
    content: {
      vaultRoot: resolve(fixturesDir, vaultRelative),
      notes: {
        path: ".",
        exclude: ["Glossary/**", "Books/**", "Clips/**", "_site/**"],
      },
      glossary: { path: "Glossary" },
      books: { path: "Books" },
    },
    build: { outDir: "dist", publicDir: "public", strict: true },
    features: { rss: true, sitemap: true, search: true },
  };
}

describe("server/notes data layer", () => {
  afterEach(() => {
    __resetNotesCacheForTests();
  });

  it("getAllNotes returns published notes sorted by updated desc", async () => {
    __setConfigForTests(makeConfig("vault"));
    const notes = await getAllNotes();
    expect(notes.map((n) => n.slug)).toEqual(["nested", "note-a", "日本語ノート", "note-b"]);
    for (const note of notes) {
      expect(typeof note.html).toBe("string");
      expect(note.html.length).toBeGreaterThan(0);
    }
  }, 30_000);

  it("getNoteBySlug returns the rendered note for a known slug", async () => {
    __setConfigForTests(makeConfig("vault"));
    const note = await getNoteBySlug("note-a");
    expect(note).toBeDefined();
    expect(note?.title).toBe("Note A の表示タイトル");
    expect(note?.html).toContain("Note A");
  }, 30_000);

  it("getNoteBySlug returns undefined for an unknown slug", async () => {
    __setConfigForTests(makeConfig("vault"));
    const note = await getNoteBySlug("does-not-exist");
    expect(note).toBeUndefined();
  }, 30_000);

  it("memoizes the dataset across calls", async () => {
    __setConfigForTests(makeConfig("vault"));
    const a = await getAllNotes();
    const b = await getAllNotes();
    // Same array reference means the dataset was reused, not rebuilt.
    expect(a).toBe(b);
  }, 30_000);
});
