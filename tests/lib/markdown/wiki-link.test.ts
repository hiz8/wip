import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { Root } from "mdast";
import { applyWikiLink } from "@/lib/markdown/plugins/wiki-link.ts";
import { buildContentIndex } from "@/lib/linkgraph/resolve.ts";
import { BuildError } from "@/lib/content/errors.ts";
import type { ContentItem, NotesFrontmatter, OutgoingLink } from "@/types/content.ts";

function note(slug: string, filePath = `${slug}.md`): ContentItem<NotesFrontmatter> {
  return {
    type: "notes",
    slug,
    filePath,
    absolutePath: `/vault/${filePath}`,
    frontmatter: {
      created: "2025-01-01T00:00:00+09:00",
      updated: "2025-01-01T00:00:00+09:00",
      status: "published",
    },
    body: "",
  };
}

function parse(markdown: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(markdown) as Root;
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

describe("applyWikiLink", () => {
  const items = [note("foo"), note("link-target")];
  const index = buildContentIndex(items);

  it("公開 Note へのリンクを link ノードに置換する", async () => {
    const tree = parse("[[foo]] と [[link-target]]");
    const outgoing: OutgoingLink[] = [];
    applyWikiLink(tree, { index, fromFilePath: "src.md", outgoing, embedded: false });
    const html = await toHtml(tree);
    expect(html).toContain('<a href="/notes/foo">foo</a>');
    expect(html).toContain('<a href="/notes/link-target">link-target</a>');
    expect(outgoing.map((o) => o.slug).toSorted()).toEqual(["foo", "link-target"]);
    expect(outgoing.every((o) => o.embedded === false)).toBe(true);
  });

  it("alias 記法は alias を表示テキストに使う", async () => {
    const tree = parse("[[foo|表示]]");
    const outgoing: OutgoingLink[] = [];
    applyWikiLink(tree, { index, fromFilePath: "src.md", outgoing, embedded: false });
    const html = await toHtml(tree);
    expect(html).toContain('<a href="/notes/foo">表示</a>');
  });

  it("type プレフィクスを解決する", async () => {
    const tree = parse("[[Notes/foo]]");
    const outgoing: OutgoingLink[] = [];
    applyWikiLink(tree, { index, fromFilePath: "src.md", outgoing, embedded: false });
    const html = await toHtml(tree);
    expect(html).toContain('<a href="/notes/foo">Notes/foo</a>');
  });

  it("未解決リンクはテキスト化し、outgoing には登録しない", async () => {
    const tree = parse("[[ghost]]");
    const outgoing: OutgoingLink[] = [];
    applyWikiLink(tree, { index, fromFilePath: "src.md", outgoing, embedded: false });
    const html = await toHtml(tree);
    expect(html).toContain("ghost");
    expect(html).not.toContain("<a");
    expect(outgoing).toEqual([]);
  });

  it("コードブロック / インラインコード内のリンクは無視", async () => {
    const tree = parse("通常 [[foo]]\n\n```\n[[foo]]\n```\n\n`[[foo]]`");
    const outgoing: OutgoingLink[] = [];
    applyWikiLink(tree, { index, fromFilePath: "src.md", outgoing, embedded: false });
    const html = await toHtml(tree);
    const linkCount = (html.match(/<a href="\/notes\/foo">/gu) ?? []).length;
    expect(linkCount).toBe(1);
    expect(outgoing.length).toBe(1);
  });

  it("曖昧な解決で BuildError", () => {
    const collidingIndex = buildContentIndex([note("dup", "a/dup.md"), note("dup", "b/dup.md")]);
    const tree = parse("[[dup]]");
    expect(() =>
      applyWikiLink(tree, {
        index: collidingIndex,
        fromFilePath: "src.md",
        outgoing: [],
        embedded: false,
      }),
    ).toThrow(BuildError);
  });

  it("![[foo]] 形式 (非画像) もリンク扱い", async () => {
    const tree = parse("![[foo]]");
    const outgoing: OutgoingLink[] = [];
    applyWikiLink(tree, { index, fromFilePath: "src.md", outgoing, embedded: false });
    const html = await toHtml(tree);
    expect(html).toContain('<a href="/notes/foo">foo</a>');
  });
});
