import { describe, expect, it } from "vitest";
import { collectBooks } from "@/lib/content/index.ts";
import { renderBooks } from "@/lib/markdown/index.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("renderBooks (integration)", () => {
  it("Books フィクスチャをすべてレンダリングする", async () => {
    const items = await collectBooks(makeConfig("vault"));
    const rendered = await renderBooks(items, makeConfig("vault"));
    expect(rendered.length).toBe(items.length);
    expect(rendered.every((r) => r.html.length > 0)).toBe(true);
  }, 30_000);

  it("title は frontmatter.aliases[0] を採用する", async () => {
    const items = await collectBooks(makeConfig("vault"));
    const rendered = await renderBooks(items, makeConfig("vault"));
    const refactoring = rendered.find((r) => r.slug === "9784873119045");
    expect(refactoring?.title).toBe("リファクタリング");
  }, 30_000);

  it("slug は ISBN ファイル名がそのまま使われる", async () => {
    const items = await collectBooks(makeConfig("vault"));
    const rendered = await renderBooks(items, makeConfig("vault"));
    const slugs = rendered.map((r) => r.slug).toSorted();
    expect(slugs).toEqual(["9784000000000", "9784000000001", "9784873119045"]);
  }, 30_000);
});
