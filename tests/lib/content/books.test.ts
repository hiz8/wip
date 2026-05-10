import { describe, expect, it } from "vitest";
import { collectBooks } from "@/lib/content/index.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("collectBooks", () => {
  it("Books 配下の全エントリを収集する (slug = ISBN)", async () => {
    const items = await collectBooks(makeConfig("vault"));
    const slugs = items.map((i) => i.slug).toSorted();

    expect(slugs).toEqual(["9784000000000", "9784000000001", "9784873119045"]);
  });

  it("ContentItem の type は books", async () => {
    const items = await collectBooks(makeConfig("vault"));
    expect(items.every((i) => i.type === "books")).toBe(true);
  });

  it("aliases / authors / pubYear / publisher が保持される", async () => {
    const items = await collectBooks(makeConfig("vault"));
    const refactoring = items.find((i) => i.slug === "9784873119045");
    expect(refactoring?.frontmatter.aliases).toEqual(["リファクタリング"]);
    expect(refactoring?.frontmatter.authors).toEqual(["Martin Fowler"]);
    expect(refactoring?.frontmatter.pubYear).toBe(2019);
    expect(refactoring?.frontmatter.publisher).toBe("O'Reilly");
  });

  it("read_date は ISO 文字列として保持される", async () => {
    const items = await collectBooks(makeConfig("vault"));
    const sample = items.find((i) => i.slug === "9784000000001");
    expect(sample?.frontmatter.read_date).toBeDefined();
    expect(typeof sample?.frontmatter.read_date).toBe("string");
  });
});
