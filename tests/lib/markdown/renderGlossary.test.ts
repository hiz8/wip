import { describe, expect, it } from "vitest";
import { collectGlossary } from "@/lib/content/index.ts";
import { renderGlossary } from "@/lib/markdown/index.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("renderGlossary (integration)", () => {
  it("Glossary フィクスチャをすべてレンダリングする", async () => {
    const items = await collectGlossary(makeConfig("vault"));
    const rendered = await renderGlossary(items, makeConfig("vault"));
    expect(rendered.length).toBe(items.length);
    expect(rendered.every((r) => r.html.length > 0)).toBe(true);
  }, 30_000);

  it("title は frontmatter.term を優先する", async () => {
    const items = await collectGlossary(makeConfig("vault"));
    const rendered = await renderGlossary(items, makeConfig("vault"));
    const reactFiber = rendered.find((r) => r.slug === "react-fiber");
    expect(reactFiber?.title).toBe("React Fiber");
    const csr = rendered.find((r) => r.slug === "csr");
    expect(csr?.title).toBe("CSR");
  }, 30_000);

  it("term 未指定時は H1 / slug にフォールバックする", async () => {
    const items = await collectGlossary(makeConfig("vault"));
    const rendered = await renderGlossary(items, makeConfig("vault"));
    const un = rendered.find((r) => r.slug === "unfurigana");
    expect(un?.title).toBe("未指定ふりがな");
  }, 30_000);
});
