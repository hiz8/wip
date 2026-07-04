import { describe, expect, it } from "vitest";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import { unified } from "unified";
import { rehypePrefixIds } from "@/lib/markdown/plugins/prefix-ids.ts";

// remark-gfm は脚注記法 ([^1]) の micromark/mdast 拡張を提供する。実運用の
// pipeline.ts も remarkParse と remarkGfm を組で使っており、それに合わせる。
async function render(md: string, prefix: string): Promise<string> {
  const out = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: prefix })
    .use(rehypeSlug)
    .use(rehypePrefixIds, { prefix })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(out);
}

describe("rehypePrefixIds", () => {
  it("見出し id にプレフィックスを付与する", async () => {
    const html = await render("## Hello", "p-2025-12-11-0930-");
    expect(html).toContain('id="p-2025-12-11-0930-hello"');
  });

  it("clobberPrefix 済みの脚注 id は二重プレフィックスしない", async () => {
    const html = await render("text[^1]\n\n[^1]: note", "p-x-");
    expect(html).toContain('href="#p-x-fn-1"');
    expect(html).not.toContain("p-x-p-x-");
  });

  it("# 始まりの内部 href にもプレフィックスを付与する", async () => {
    const html = await render("[jump](#hello)\n\n## Hello", "p-x-");
    expect(html).toContain('href="#p-x-hello"');
  });
});
