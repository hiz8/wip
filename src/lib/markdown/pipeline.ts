import type { Root } from "mdast";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Processor } from "unified";

import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import { buildContentIndex } from "@/lib/linkgraph/resolve.ts";
import { attachBacklinks, buildBacklinks, type RenderedNoteDraft } from "@/lib/linkgraph/graph.ts";
import type {
  CalloutEntry,
  ContentItem,
  FootnoteEntry,
  ImageRef,
  NotesFrontmatter,
  OutgoingLink,
  RenderedNote,
  TocEntry,
} from "@/types/content.ts";
import { applyCallout } from "./plugins/callout.ts";
import { applyEmbed } from "./plugins/embed.ts";
import { applyFootnote } from "./plugins/footnote.ts";
import { applyImage } from "./plugins/image.ts";
import { applyToc, extractFirstH1 } from "./plugins/toc.ts";
import { applyWikiLink } from "./plugins/wiki-link.ts";
import { getShikiOptions, rehypeShiki } from "./shiki.ts";

export async function renderNotes(
  items: ContentItem<NotesFrontmatter>[],
  config: SiteConfigParsed,
): Promise<RenderedNote[]> {
  const index = buildContentIndex(items);
  const mdParser = unified().use(remarkParse).use(remarkGfm);
  const subRenderer = createSubRenderer();
  const finalRenderer = await createFinalRenderer();

  const parsedBodies = new Map<string, Root>();
  for (const item of items) {
    parsedBodies.set(item.slug, mdParser.parse(item.body) as Root);
  }

  const drafts: RenderedNoteDraft[] = [];

  for (const item of items) {
    const sourceTree = parsedBodies.get(item.slug);
    if (!sourceTree) continue;
    const tree = structuredClone(sourceTree) as Root;

    const outgoing: OutgoingLink[] = [];
    const callouts: CalloutEntry[] = [];
    const footnotes: FootnoteEntry[] = [];
    const images: ImageRef[] = [];
    const toc: TocEntry[] = [];

    applyEmbed(tree, {
      index,
      fromFilePath: item.filePath,
      fromSlug: item.slug,
      outgoing,
      parsedBodies,
    });

    applyImage(tree, {
      fromAbsolutePath: item.absolutePath,
      vaultRoot: config.content.vaultRoot,
      images,
    });

    applyWikiLink(tree, {
      index,
      fromFilePath: item.filePath,
      outgoing,
      embedded: false,
    });

    await applyCallout(tree, {
      callouts,
      renderHtml: (subtree) => renderSubtree(subRenderer, subtree),
    });

    applyToc(tree, { entries: toc });

    await applyFootnote(tree, {
      footnotes,
      renderHtml: (subtree) => renderSubtree(subRenderer, subtree),
    });

    const html = await renderSubtree(finalRenderer, tree);

    const title = pickTitle(item, sourceTree);

    drafts.push({
      type: item.type,
      slug: item.slug,
      filePath: item.filePath,
      absolutePath: item.absolutePath,
      frontmatter: item.frontmatter,
      body: item.body,
      html,
      title,
      toc,
      outgoingLinks: outgoing,
      footnotes,
      callouts,
      images,
    });
  }

  const backlinks = buildBacklinks(drafts);
  return attachBacklinks(drafts, backlinks);
}

type AnyProcessor = Processor<Root, Root, Root, Root, string>;

async function createFinalRenderer(): Promise<AnyProcessor> {
  const processor = unified()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeShiki, getShikiOptions())
    .use(rehypeStringify, { allowDangerousHtml: true });
  return processor as unknown as AnyProcessor;
}

function createSubRenderer(): AnyProcessor {
  const processor = unified()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true });
  return processor as unknown as AnyProcessor;
}

async function renderSubtree(processor: AnyProcessor, tree: Root): Promise<string> {
  const transformed = (await processor.run(tree)) as Root;
  return processor.stringify(transformed) as string;
}

function pickTitle(item: ContentItem<NotesFrontmatter>, tree: Root): string {
  const fromFrontmatter = item.frontmatter.title?.trim();
  if (fromFrontmatter && fromFrontmatter.length > 0) return fromFrontmatter;
  const fromHeading = extractFirstH1(tree);
  if (fromHeading) return fromHeading;
  return item.slug;
}
