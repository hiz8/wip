import { describe, expect, it } from "vitest";
import { collectGlossary } from "@/lib/content/index.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("collectGlossary", () => {
  it("Glossary 配下の公開済みエントリのみ収集する", async () => {
    const items = await collectGlossary(makeConfig("vault"));
    const slugs = items.map((i) => i.slug).toSorted();

    expect(slugs).toContain("term");
    expect(slugs).toContain("react-fiber");
    expect(slugs).toContain("csr");
    expect(slugs).toContain("unfurigana");
    expect(slugs).not.toContain("draft-term");
  });

  it("ContentItem の type は glossary", async () => {
    const items = await collectGlossary(makeConfig("vault"));
    expect(items.every((i) => i.type === "glossary")).toBe(true);
  });

  it("term / furigana / aliases が frontmatter に保持される", async () => {
    const items = await collectGlossary(makeConfig("vault"));
    const reactFiber = items.find((i) => i.slug === "react-fiber");
    expect(reactFiber?.frontmatter.term).toBe("React Fiber");
    expect(reactFiber?.frontmatter.furigana).toBe("りあくとふぁいばー");
    expect(reactFiber?.frontmatter.aliases).toEqual(["ファイバー"]);
  });

  it("furigana 未指定エントリは undefined のまま渡る", async () => {
    const items = await collectGlossary(makeConfig("vault"));
    const un = items.find((i) => i.slug === "unfurigana");
    expect(un).toBeDefined();
    expect(un?.frontmatter.furigana).toBeUndefined();
  });
});
