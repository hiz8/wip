import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { Root } from "mdast";
import { applyFootnote } from "@/lib/markdown/plugins/footnote.ts";
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
  it("脚注定義を抽出し、参照の直後にインライン aside を挿入する", async () => {
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

    // The inline aside is the canonical source for floating gutter display;
    // CSS hides it on narrow viewports where FootnoteSection takes over.
    expect(html).toContain('<span class="footnote-aside"');
    expect(html).toContain("一つめ。");
    expect(html).toContain("二つめ。");
    expect(html).toContain('id="user-content-fn-aside-1"');
    expect(html).toContain('id="user-content-fn-aside-longer"');
    // The aside must not contain a nested <p>: it lives inside a parent <p>
    // (paragraph holding the footnote reference) and a nested <p> would
    // make the browser auto-close the outer paragraph, leaving the aside
    // empty so CSS float never applies.
    const asideMatches = html.matchAll(/<span class="footnote-aside"[^>]*>([\s\S]*?)<\/span>/gu);
    for (const m of asideMatches) {
      expect(m[1]).not.toContain("<p");
    }
  });

  it("脚注がない場合は何もしない", async () => {
    const tree = parse("普通のテキスト。");
    const footnotes: FootnoteEntry[] = [];
    await applyFootnote(tree, { footnotes, renderHtml });
    expect(footnotes).toEqual([]);
  });
});
