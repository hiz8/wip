import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { Root } from "mdast";
import { applyCallout } from "@/lib/markdown/plugins/callout.ts";
import type { CalloutEntry } from "@/types/content.ts";

function parse(md: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
}

async function toHtml(tree: Root): Promise<string> {
  const transformed = await unified()
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .run(tree);
  return unified()
    .use(rehypeStringify)
    .stringify(transformed as never) as string;
}

const renderHtml = async (subtree: Root): Promise<string> => {
  return await toHtml(subtree);
};

describe("applyCallout", () => {
  it("サポートされる種別に data-callout 属性を付与する", async () => {
    const tree = parse(
      ["> [!note] タイトル", "> 本文です。", "", "> [!quote]", "> 引用。"].join("\n"),
    );
    const callouts: CalloutEntry[] = [];
    await applyCallout(tree, { callouts, renderHtml });
    const html = await toHtml(tree);
    expect(html).toContain('data-callout="note"');
    expect(html).toContain('data-callout="quote"');
    expect(html).toContain('data-callout-title="タイトル"');
    expect(callouts.length).toBe(2);
    expect(callouts[0]?.kind).toBe("note");
    expect(callouts[0]?.title).toBe("タイトル");
    expect(callouts[1]?.kind).toBe("quote");
  });

  it("private を含むタイトルは除去される", async () => {
    const tree = parse(["> [!note] private メモ", "> このメモは非公開。", "", "段落。"].join("\n"));
    const callouts: CalloutEntry[] = [];
    await applyCallout(tree, { callouts, renderHtml });
    const html = await toHtml(tree);
    expect(html).not.toContain("このメモは非公開");
    expect(callouts.length).toBe(0);
  });

  it("未対応種別は note として扱う", async () => {
    const tree = parse(["> [!abstract] 概要", "> 本文。"].join("\n"));
    const callouts: CalloutEntry[] = [];
    await applyCallout(tree, { callouts, renderHtml });
    const html = await toHtml(tree);
    expect(html).toContain('data-callout="note"');
    expect(callouts[0]?.kind).toBe("note");
  });

  it("ヘッダ行は本文から除去される", async () => {
    const tree = parse("> [!info] 関連\n> 本文行。");
    const callouts: CalloutEntry[] = [];
    await applyCallout(tree, { callouts, renderHtml });
    const html = await toHtml(tree);
    expect(html).not.toContain("[!info]");
    expect(html).toContain("本文行");
  });
});
