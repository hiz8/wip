import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { Root } from "mdast";
import { applyFootnote } from "@/lib/markdown/plugins/footnote.ts";
import { assignMarginaliaSides } from "@/lib/markdown/plugins/marginalia-side.ts";
import type { FootnoteEntry } from "@/types/content.ts";

function parse(md: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
}

async function toHtml(tree: Root): Promise<string> {
  const transformed = await unified()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .run(tree);
  return unified()
    .use(rehypeStringify, { allowDangerousHtml: true })
    .stringify(transformed as never) as string;
}

const renderHtml = (subtree: Root): Promise<string> => Promise.resolve(toHtml(subtree));

describe("applyFootnote", () => {
  it("脚注定義を抽出し、参照を含む paragraph の直後に block aside を挿入する", async () => {
    const tree = parse(
      ["本文に[^1]脚注。", "別の[^longer]脚注。", "", "[^1]: 一つめ。", "[^longer]: 二つめ。"].join(
        "\n",
      ),
    );
    const footnotes: FootnoteEntry[] = [];
    await applyFootnote(tree, { footnotes, renderHtml });

    const html = await toHtml(tree);

    expect(footnotes.length).toBe(2);
    const ids = footnotes.map((f) => f.id);
    expect(ids).toContain("1");
    expect(ids).toContain("longer");
    expect(footnotes[0]?.html).toContain("一つめ");

    // The aside is now a block-level <aside> sibling of the host paragraph;
    // ordinal ids guarantee uniqueness regardless of identifier shape.
    expect(html).toContain('<aside class="footnote-aside"');
    expect(html).toContain('id="user-content-fn-aside-1"');
    expect(html).toContain('id="user-content-fn-aside-2"');
    expect(html).toContain("一つめ。");
    expect(html).toContain("二つめ。");

    // The aside is a sibling of the paragraph, not nested inside it: there
    // must be no <aside> opening tag inside any <p>...</p>.
    const paragraphMatches = html.matchAll(/<p>([\s\S]*?)<\/p>/gu);
    for (const m of paragraphMatches) {
      expect(m[1]).not.toContain("<aside");
    }
  });

  it("multi-paragraph footnote body も aside 内に保持する", async () => {
    const tree = parse(
      ["本文に[^x]脚注。", "", "[^x]: 一段落目。", "", "    二段落目。"].join("\n"),
    );
    const footnotes: FootnoteEntry[] = [];
    await applyFootnote(tree, { footnotes, renderHtml });

    const html = await toHtml(tree);

    expect(html).toContain('<aside class="footnote-aside"');
    expect(html).toContain("一段落目");
    expect(html).toContain("二段落目");
    // Both paragraphs survive inside the aside.
    const asideMatch = /<aside class="footnote-aside"[\s\S]*?<\/aside>/u.exec(html);
    expect(asideMatch).not.toBeNull();
    const paragraphCount = (asideMatch?.[0].match(/<p>/gu) ?? []).length;
    expect(paragraphCount).toBeGreaterThanOrEqual(2);
  });

  it("同一 identifier を複数回参照しても aside id が衝突しない", async () => {
    const tree = parse(["本文[^a]と再び[^a]を引く。", "", "[^a]: 一つめ。"].join("\n"));
    const footnotes: FootnoteEntry[] = [];
    await applyFootnote(tree, { footnotes, renderHtml });

    const html = await toHtml(tree);

    expect(html).toContain('id="user-content-fn-aside-1"');
    expect(html).toContain('id="user-content-fn-aside-2"');
    // The same body html is repeated because both references resolve to one
    // definition, but the ordinal ids are distinct so the DOM is valid.
    const asideOpens = html.match(/<aside class="footnote-aside"/gu) ?? [];
    expect(asideOpens.length).toBe(2);
  });

  it("日本語 identifier の aside id がカウンタで衝突回避される", async () => {
    const tree = parse(["本文[^あ]と[^い]。", "", "[^あ]: A.", "", "[^い]: B."].join("\n"));
    const footnotes: FootnoteEntry[] = [];
    await applyFootnote(tree, { footnotes, renderHtml });

    const html = await toHtml(tree);

    expect(html).toContain('id="user-content-fn-aside-1"');
    expect(html).toContain('id="user-content-fn-aside-2"');
  });

  it("assignMarginaliaSides で付いた data-side を aside に転写する", async () => {
    const tree = parse(["本文[^1]と[^2]。", "", "[^1]: A.", "", "[^2]: B."].join("\n"));
    assignMarginaliaSides(tree);
    const footnotes: FootnoteEntry[] = [];
    await applyFootnote(tree, { footnotes, renderHtml });

    const html = await toHtml(tree);

    expect(html).toMatch(
      /<aside class="footnote-aside" id="user-content-fn-aside-1" data-side="right"/u,
    );
    expect(html).toMatch(
      /<aside class="footnote-aside" id="user-content-fn-aside-2" data-side="left"/u,
    );
  });

  it("脚注がない場合は何もしない", async () => {
    const tree = parse("普通のテキスト。");
    const footnotes: FootnoteEntry[] = [];
    await applyFootnote(tree, { footnotes, renderHtml });
    expect(footnotes).toEqual([]);
  });
});
