import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { applyToc } from "@/lib/markdown/plugins/toc.ts";
import { rehypeSectionize } from "@/lib/markdown/plugins/sectionize.ts";
import type { Root } from "mdast";
import type { TocEntry } from "@/types/content.ts";

async function render(md: string): Promise<string> {
  const mdTree = unified().use(remarkParse).parse(md) as Root;
  const entries: TocEntry[] = [];
  applyToc(mdTree, { entries });
  const processor = unified()
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeSectionize)
    .use(rehypeStringify);
  const file = await processor.run(mdTree);
  return processor.stringify(file as never);
}

describe("rehypeSectionize", () => {
  it("flat h2 are each wrapped in a <section data-heading-id>", async () => {
    const html = await render(["## A", "para a", "## B", "para b"].join("\n\n"));
    expect(html).toContain('<section data-heading-id="a"><h2 id="a">A</h2>');
    expect(html).toContain('<section data-heading-id="b"><h2 id="b">B</h2>');
    // Two top-level sections, no nesting
    expect(html.match(/<section /gu)?.length).toBe(2);
  });

  it("h3 are nested inside the parent h2 section", async () => {
    const html = await render(
      ["## A", "### A1", "para a1", "### A2", "para a2", "## B", "para b"].join("\n\n"),
    );
    // Outer h2 sections plus nested h3 sections = 4
    expect(html.match(/<section /gu)?.length).toBe(4);
    expect(html).toContain('<section data-heading-id="a"><h2 id="a">A</h2>');
    expect(html).toContain('<section data-heading-id="a1"><h3 id="a1">A1</h3>');
    expect(html).toContain('<section data-heading-id="a2"><h3 id="a2">A2</h3>');
    // a2 section must close before b section opens
    const a2Open = html.indexOf('data-heading-id="a2"');
    const bOpen = html.indexOf('data-heading-id="b"');
    expect(a2Open).toBeGreaterThan(-1);
    expect(bOpen).toBeGreaterThan(a2Open);
  });

  it("content before the first h2 stays outside any section", async () => {
    const html = await render(["# Title", "intro paragraph", "## A", "para a"].join("\n\n"));
    const firstSection = html.indexOf("<section ");
    const intro = html.indexOf("intro paragraph");
    expect(intro).toBeGreaterThan(-1);
    expect(firstSection).toBeGreaterThan(intro);
    expect(html).toContain('<h1 id="title">Title</h1>');
  });

  it("h4 and below stay inside the nearest h2/h3 section", async () => {
    const html = await render(["## A", "### A1", "#### Deep", "para"].join("\n\n"));
    // The h4 must appear inside the h3 section (which is inside the h2 section)
    const a1Open = html.indexOf('data-heading-id="a1"');
    const deep = html.indexOf("<h4");
    expect(a1Open).toBeGreaterThan(-1);
    expect(deep).toBeGreaterThan(a1Open);
  });

  it("documents without h2/h3 pass through unchanged", async () => {
    const html = await render(["# Only H1", "just paragraphs", "more text"].join("\n\n"));
    expect(html).not.toContain("<section");
    expect(html).toContain('<h1 id="only-h1">Only H1</h1>');
  });

  it("duplicate heading text uses suffixed ids consistently", async () => {
    const html = await render(["## Section", "## Section"].join("\n\n"));
    expect(html).toContain('<section data-heading-id="section"><h2 id="section">Section</h2>');
    expect(html).toContain('<section data-heading-id="section-1"><h2 id="section-1">Section</h2>');
  });
});
