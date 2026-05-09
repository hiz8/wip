import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import type { Root } from "mdast";
import { applyEmbed } from "@/lib/markdown/plugins/embed.ts";
import { applyWikiLink } from "@/lib/markdown/plugins/wiki-link.ts";
import { buildContentIndex } from "@/lib/linkgraph/resolve.ts";
import { BuildError } from "@/lib/content/errors.ts";
import type { ContentItem, NotesFrontmatter, OutgoingLink } from "@/types/content.ts";

function note(slug: string): ContentItem<NotesFrontmatter> {
  return {
    type: "notes",
    slug,
    filePath: `${slug}.md`,
    absolutePath: `/vault/${slug}.md`,
    frontmatter: {
      title: `Title of ${slug}`,
      created: "2025-01-01T00:00:00+09:00",
      updated: "2025-01-01T00:00:00+09:00",
      status: "published",
    },
    body: "",
  };
}

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

describe("applyEmbed", () => {
  it("公開 Note の本文を展開し、Source リンクを付ける", async () => {
    const items = [note("host"), note("target")];
    const index = buildContentIndex(items);
    const parsedBodies = new Map<string, Root>();
    parsedBodies.set("host", parse("![[target]]"));
    parsedBodies.set("target", parse("# Target\n\n本文。"));

    const tree = structuredClone(parsedBodies.get("host")!) as Root;
    const outgoing: OutgoingLink[] = [];
    applyEmbed(tree, {
      index,
      fromFilePath: "host.md",
      fromSlug: "host",
      outgoing,
      parsedBodies,
    });

    const html = await toHtml(tree);
    expect(html).toContain("Target");
    expect(html).toContain("本文");
    expect(html).toContain('href="/notes/target"');
    expect(outgoing).toEqual([{ type: "notes", slug: "target", raw: "target", embedded: true }]);
  });

  it("Embed 内のさらなる Embed はリンクに降格される", async () => {
    const items = [note("host"), note("target"), note("grandchild")];
    const index = buildContentIndex(items);
    const parsedBodies = new Map<string, Root>();
    parsedBodies.set("host", parse("![[target]]"));
    parsedBodies.set("target", parse("# Target\n\n![[grandchild]]"));
    parsedBodies.set("grandchild", parse("# Grandchild"));

    const tree = structuredClone(parsedBodies.get("host")!) as Root;
    const outgoing: OutgoingLink[] = [];
    applyEmbed(tree, {
      index,
      fromFilePath: "host.md",
      fromSlug: "host",
      outgoing,
      parsedBodies,
    });

    applyWikiLink(tree, {
      index,
      fromFilePath: "host.md",
      outgoing,
      embedded: true,
    });

    const html = await toHtml(tree);
    expect(html).toContain('href="/notes/grandchild"');
    expect(html).not.toContain("![[grandchild]]");
  });

  it("自己 Embed は BuildError", () => {
    const items = [note("host")];
    const index = buildContentIndex(items);
    const parsedBodies = new Map<string, Root>();
    parsedBodies.set("host", parse("![[host]]"));

    const tree = structuredClone(parsedBodies.get("host")!) as Root;
    expect(() =>
      applyEmbed(tree, {
        index,
        fromFilePath: "host.md",
        fromSlug: "host",
        outgoing: [],
        parsedBodies,
      }),
    ).toThrow(BuildError);
  });

  it("未解決の Embed はテキスト化", async () => {
    const items = [note("host")];
    const index = buildContentIndex(items);
    const parsedBodies = new Map<string, Root>();
    parsedBodies.set("host", parse("![[ghost]]"));

    const tree = structuredClone(parsedBodies.get("host")!) as Root;
    const outgoing: OutgoingLink[] = [];
    applyEmbed(tree, {
      index,
      fromFilePath: "host.md",
      fromSlug: "host",
      outgoing,
      parsedBodies,
    });

    const html = await toHtml(tree);
    expect(html).toContain("ghost");
    expect(html).not.toContain("[[");
    expect(outgoing).toEqual([]);
  });

  it("画像拡張子の Embed は image ノードに変換", async () => {
    const items = [note("host")];
    const index = buildContentIndex(items);
    const parsedBodies = new Map<string, Root>();
    parsedBodies.set("host", parse("![[picture.png|代替]]"));

    const tree = structuredClone(parsedBodies.get("host")!) as Root;
    const outgoing: OutgoingLink[] = [];
    applyEmbed(tree, {
      index,
      fromFilePath: "host.md",
      fromSlug: "host",
      outgoing,
      parsedBodies,
    });

    const html = await toHtml(tree);
    expect(html).toContain('src="picture.png"');
    expect(html).toContain('alt="代替"');
  });
});
