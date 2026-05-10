import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";
import { collectMarkdownFiles } from "@/lib/content/collect.ts";

const fixturesDir = fileURLToPath(new URL("../../fixtures", import.meta.url));
const vaultRoot = resolve(fixturesDir, "vault");

describe("collectMarkdownFiles", () => {
  it("Notes 直下とサブフォルダを列挙し、exclude が効く", async () => {
    const files = await collectMarkdownFiles({
      vaultRoot,
      path: ".",
      exclude: ["Glossary/**", "Books/**", "Clips/**", "_site/**"],
    });

    const relPaths = files.map((p) => relative(vaultRoot, p)).toSorted();

    expect(relPaths).toContain("note-a.md");
    expect(relPaths).toContain("note-b.md");
    expect(relPaths).toContain("frontend/nested.md");
    expect(relPaths).toContain("draft.md");
    expect(relPaths).toContain("archived.md");
    expect(relPaths).toContain("日本語ノート.md");

    // exclude されているはず
    expect(relPaths.some((p) => p.startsWith("Glossary/"))).toBe(false);
    expect(relPaths.some((p) => p.startsWith("Books/"))).toBe(false);
    expect(relPaths.some((p) => p.startsWith("Clips/"))).toBe(false);
    expect(relPaths.some((p) => p.startsWith("_site/"))).toBe(false);
  });

  it("絶対パスを返す", async () => {
    const files = await collectMarkdownFiles({
      vaultRoot,
      path: ".",
      exclude: ["Glossary/**", "Books/**", "Clips/**", "_site/**"],
    });

    for (const file of files) {
      expect(file.startsWith("/")).toBe(true);
    }
  });
});
