import { afterEach, describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { resolveConfig } from "@/lib/config/index.ts";
import siteConfigInput from "../../site.config.ts";
import {
  __resetNotesCacheForTests,
  __setConfigForTests,
  getAllNotes,
  getNoteBySlug,
} from "@/server/notes.ts";
import { buildTreeFromRenderedNotes } from "@/lib/tree/buildTree.ts";

const fixturesVault = resolve(__dirname, "../fixtures/vault");

function loadFixtureConfig() {
  const original = process.env["VAULT_ROOT"];
  process.env["VAULT_ROOT"] = fixturesVault;
  try {
    return resolveConfig(siteConfigInput, { loadEnv: false });
  } finally {
    if (original === undefined) delete process.env["VAULT_ROOT"];
    else process.env["VAULT_ROOT"] = original;
  }
}

describe("notes data layer (loader inputs)", () => {
  afterEach(() => {
    __resetNotesCacheForTests();
  });

  it("getAllNotes provides every field needed by the index loader", async () => {
    __setConfigForTests(loadFixtureConfig());
    const notes = await getAllNotes();
    expect(notes.length).toBeGreaterThan(0);
    for (const note of notes) {
      expect(typeof note.slug).toBe("string");
      expect(typeof note.title).toBe("string");
      expect(typeof note.frontmatter.updated).toBe("string");
      expect(Array.isArray(note.frontmatter.tags ?? [])).toBe(true);
    }
  });

  it("getNoteBySlug returns toc and incomingLinks for the detail loader", async () => {
    __setConfigForTests(loadFixtureConfig());
    const list = await getAllNotes();
    const slug = list[0]?.slug;
    if (!slug) throw new Error("expected at least one note");
    const note = await getNoteBySlug(slug);
    expect(note).toBeDefined();
    if (!note) return;
    expect(typeof note.html).toBe("string");
    expect(Array.isArray(note.toc)).toBe(true);
    expect(Array.isArray(note.incomingLinks)).toBe(true);
    expect(Array.isArray(note.footnotes)).toBe(true);
    expect(Array.isArray(note.callouts)).toBe(true);
  });

  it("getNoteBySlug surfaces footnotes and non-private callouts for the detail loader", async () => {
    __setConfigForTests(loadFixtureConfig());
    const note = await getNoteBySlug("note-with-marginalia");
    expect(note).toBeDefined();
    if (!note) return;
    expect(note.footnotes.length).toBe(2);
    const footnoteIds = note.footnotes.map((f) => f.id);
    expect(footnoteIds).toContain("1");
    expect(footnoteIds).toContain("longer");
    expect(note.callouts.length).toBe(2);
    expect(note.callouts.map((c) => c.kind)).toEqual(["note", "warning"]);
  });

  it("getNoteBySlug returns undefined for an unknown slug", async () => {
    __setConfigForTests(loadFixtureConfig());
    const result = await getNoteBySlug("definitely-not-a-real-slug");
    expect(result).toBeUndefined();
  });

  it("buildTreeFromRenderedNotes mirrors the fixture vault folder hierarchy", async () => {
    __setConfigForTests(loadFixtureConfig());
    const notes = await getAllNotes();
    const tree = buildTreeFromRenderedNotes(notes);
    expect(tree.find((n) => n.kind === "folder" && n.name === "frontend")).toBeDefined();
    const topLevelNotes = tree.filter((n) => n.kind === "note");
    expect(topLevelNotes.length).toBeGreaterThan(0);
  });
});
