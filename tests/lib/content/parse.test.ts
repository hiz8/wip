import { describe, it, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parseMarkdownFile } from "@/lib/content/parse.ts";

const fixturesDir = fileURLToPath(new URL("../../fixtures", import.meta.url));
const vaultRoot = resolve(fixturesDir, "vault");

describe("parseMarkdownFile", () => {
  it("frontmatter と body を分離する", async () => {
    const parsed = await parseMarkdownFile(resolve(vaultRoot, "note-a.md"), vaultRoot);
    expect(parsed.rawFrontmatter["title"]).toBe("Note A の表示タイトル");
    expect(parsed.rawFrontmatter["tags"]).toEqual(["frontend", "frontend/react"]);
    expect(parsed.body).toContain("# Note A");
    expect(parsed.filePath).toBe("note-a.md");
  });

  it("vault からの相対パスを返す (サブフォルダの場合も)", async () => {
    const parsed = await parseMarkdownFile(resolve(vaultRoot, "frontend/nested.md"), vaultRoot);
    expect(parsed.filePath).toBe("frontend/nested.md");
  });

  it("frontmatter なしのファイルでも空オブジェクトとして扱う", async () => {
    const parsed = await parseMarkdownFile(resolve(vaultRoot, "_site/home.md"), vaultRoot);
    expect(parsed.rawFrontmatter).toEqual({});
    expect(parsed.body.length).toBeGreaterThan(0);
  });
});
