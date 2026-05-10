import { afterEach, describe, expect, it } from "vitest";
import {
  __resetGlossaryCacheForTests,
  __setGlossaryConfigForTests,
  getAllGlossaryTerms,
  getGlossaryGroupedIndex,
  getGlossaryTermBySlug,
} from "@/server/glossary.ts";
import { makeConfig } from "../helpers/makeConfig.ts";

describe("server/glossary data layer", () => {
  afterEach(() => {
    __resetGlossaryCacheForTests();
  });

  it("getAllGlossaryTerms returns published terms only", async () => {
    __setGlossaryConfigForTests(makeConfig("vault"));
    const terms = await getAllGlossaryTerms();
    const slugs = terms.map((t) => t.slug).toSorted();
    expect(slugs).toEqual(["csr", "react-fiber", "term", "unfurigana"]);
  }, 30_000);

  it("getGlossaryTermBySlug returns the term for a known slug", async () => {
    __setGlossaryConfigForTests(makeConfig("vault"));
    const term = await getGlossaryTermBySlug("react-fiber");
    expect(term).toBeDefined();
    expect(term?.title).toBe("React Fiber");
    expect(term?.frontmatter.furigana).toBe("りあくとふぁいばー");
  }, 30_000);

  it("getGlossaryTermBySlug returns undefined for an unknown slug", async () => {
    __setGlossaryConfigForTests(makeConfig("vault"));
    const term = await getGlossaryTermBySlug("missing");
    expect(term).toBeUndefined();
  }, 30_000);

  it("getGlossaryGroupedIndex returns 五十音 sections in canonical order", async () => {
    __setGlossaryConfigForTests(makeConfig("vault"));
    const sections = await getGlossaryGroupedIndex();
    const names = sections.map((s) => s.name);
    expect(names).toEqual(["あ行", "さ行", "ら行", "その他"]);
    const a = sections.find((s) => s.name === "あ行");
    expect(a?.items.map((i) => i.slug)).toContain("term");
  }, 30_000);
});
