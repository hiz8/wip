import type { Root } from "mdast";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified, type Processor } from "unified";

import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import { buildContentIndex, type ContentIndex } from "@/lib/linkgraph/resolve.ts";
import { attachBacklinks, buildBacklinks, type RenderedItemDraft } from "@/lib/linkgraph/graph.ts";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";
import { blogArticleTitle } from "@/lib/blog/tagset.ts";
import type {
  BaseFrontmatter,
  BlogFrontmatter,
  BooksFrontmatter,
  CalloutEntry,
  ContentItem,
  FootnoteEntry,
  GlossaryFrontmatter,
  ImageRef,
  NotesFrontmatter,
  OutgoingLink,
  RenderedBlogArticle,
  RenderedBook,
  RenderedGlossaryTerm,
  RenderedNote,
  TocEntry,
} from "@/types/content.ts";
import { applyCallout } from "./plugins/callout.ts";
import { applyEmbed } from "./plugins/embed.ts";
import { applyFootnote } from "./plugins/footnote.ts";
import { applyImage } from "./plugins/image.ts";
import { assignMarginaliaSides } from "./plugins/marginalia-side.ts";
import { rehypePrefixIds } from "./plugins/prefix-ids.ts";
import { rehypeSectionize } from "./plugins/sectionize.ts";
import { applyToc, extractFirstH1 } from "./plugins/toc.ts";
import { applyWikiLink } from "./plugins/wiki-link.ts";
import { rehypeShiki, SHIKI_OPTIONS } from "./shiki.ts";

export interface RenderContentSpec<F extends BaseFrontmatter> {
  items: ContentItem<F>[];
  config: SiteConfigParsed;
  index: ContentIndex;
  pickTitle: (item: ContentItem<F>, tree: Root) => string;
  /** 記事ごとの id 名前空間 (Blog 用)。返り値は "p-2025-12-11-0930-" のような末尾 "-" 付き */
  idPrefix?: (item: ContentItem<F>) => string;
}

// Internal: コンテンツを draft へレンダリングする (backlinks は未付与)。呼び出し
// 元がタイプをまたいで backlinks を外部で配線することで、cross-type の双方向
// リンクを全 draft の和集合に対して一度だけ計算できる。
export async function renderContentDrafts<F extends BaseFrontmatter>(
  spec: RenderContentSpec<F>,
): Promise<RenderedItemDraft<F>[]> {
  const { items, config, index, pickTitle } = spec;
  const mdParser = unified().use(remarkParse).use(remarkGfm);
  const subRenderer = createSubRenderer();
  const finalRenderer = createFinalRenderer();

  const parsedBodies = new Map<string, Root>();
  for (const item of items) {
    parsedBodies.set(`${item.type}/${item.slug}`, mdParser.parse(item.body) as Root);
  }
  const flatBodies = bodiesForEmbed(parsedBodies);

  const drafts: RenderedItemDraft<F>[] = [];

  for (const item of items) {
    const sourceTree = parsedBodies.get(`${item.type}/${item.slug}`)!;
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
      parsedBodies: flatBodies,
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

    assignMarginaliaSides(tree);

    const prefix = spec.idPrefix?.(item);

    await applyFootnote(tree, {
      footnotes,
      renderHtml: (subtree) => renderSubtree(subRenderer, subtree),
      ...(prefix === undefined ? {} : { idPrefix: prefix }),
    });

    const renderer = prefix === undefined ? finalRenderer : createFinalRenderer(prefix);
    const html = await renderSubtree(renderer, tree);
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

  return drafts;
}

// applyEmbed は slug のみをキーにした map を期待する (後方互換)。一方 cross-type
// のレンダリングは曖昧さを避けるため `${type}/${slug}` でスコープするので、ここで
// slug キーへ畳み直して公開する。
function bodiesForEmbed(scoped: Map<string, Root>): Map<string, Root> {
  const flat = new Map<string, Root>();
  for (const [key, value] of scoped.entries()) {
    const slashIdx = key.indexOf("/");
    const slug = slashIdx === -1 ? key : key.slice(slashIdx + 1);
    flat.set(slug, value);
  }
  return flat;
}

export async function renderNotes(
  items: ContentItem<NotesFrontmatter>[],
  config: SiteConfigParsed,
): Promise<RenderedNote[]> {
  const index = buildContentIndex(items);
  const drafts = await renderContentDrafts<NotesFrontmatter>({
    items,
    config,
    index,
    pickTitle: pickNotesTitle,
  });
  const backlinks = buildBacklinks(drafts);
  return attachBacklinks<NotesFrontmatter>(drafts, backlinks);
}

export async function renderGlossary(
  items: ContentItem<GlossaryFrontmatter>[],
  config: SiteConfigParsed,
): Promise<RenderedGlossaryTerm[]> {
  const index = buildContentIndex(items);
  const drafts = await renderContentDrafts<GlossaryFrontmatter>({
    items,
    config,
    index,
    pickTitle: pickGlossaryTitle,
  });
  const backlinks = buildBacklinks(drafts);
  return attachBacklinks<GlossaryFrontmatter>(drafts, backlinks);
}

export async function renderBooks(
  items: ContentItem<BooksFrontmatter>[],
  config: SiteConfigParsed,
): Promise<RenderedBook[]> {
  const index = buildContentIndex(items);
  const drafts = await renderContentDrafts<BooksFrontmatter>({
    items,
    config,
    index,
    pickTitle: pickBooksTitle,
  });
  const backlinks = buildBacklinks(drafts);
  return attachBacklinks<BooksFrontmatter>(drafts, backlinks);
}

export const pickBlogTitle = (item: ContentItem<BlogFrontmatter>): string =>
  blogArticleTitle(item.frontmatter.tags);

// Blog はリンクの受け手にならない (docs/blog-spec.md「リンクグラフへの参加」)。
// index には Notes / Glossary / Books のみを登録し、backlinks は配線しない。
export async function renderBlog(
  items: ContentItem<BlogFrontmatter>[],
  config: SiteConfigParsed,
  index?: ContentIndex,
): Promise<RenderedBlogArticle[]> {
  const drafts = await renderContentDrafts<BlogFrontmatter>({
    items,
    config,
    index: index ?? buildContentIndex([]),
    pickTitle: pickBlogTitle,
    idPrefix: (item) => `${parseBlogSlugDate(item.slug, "+00:00")!.anchorId}-`,
  });
  return drafts.map((draft) => Object.assign(draft, { incomingLinks: [] }));
}

type AnyProcessor = Processor<Root, Root, Root, Root, string>;

function createFinalRenderer(idPrefix?: string): AnyProcessor {
  if (idPrefix === undefined) {
    const processor = unified()
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeSlug)
      .use(rehypeSectionize)
      .use(rehypeShiki, SHIKI_OPTIONS)
      .use(rehypeStringify, { allowDangerousHtml: true });
    return processor as unknown as AnyProcessor;
  }
  const processor = unified()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: idPrefix })
    .use(rehypeSlug)
    .use(rehypePrefixIds, { prefix: idPrefix })
    .use(rehypeSectionize)
    .use(rehypeShiki, SHIKI_OPTIONS)
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

function makeTitlePicker<F extends BaseFrontmatter>(
  get: (fm: F) => string | undefined,
): (item: ContentItem<F>, tree: Root) => string {
  return (item, tree) => {
    const trimmed = get(item.frontmatter)?.trim();
    if (trimmed && trimmed.length > 0) return trimmed;
    const fromHeading = extractFirstH1(tree);
    if (fromHeading) return fromHeading;
    return item.slug;
  };
}

export const pickNotesTitle = makeTitlePicker<NotesFrontmatter>((fm) => fm.title);
export const pickGlossaryTitle = makeTitlePicker<GlossaryFrontmatter>((fm) => fm.term);
export const pickBooksTitle = makeTitlePicker<BooksFrontmatter>((fm) => fm.aliases[0]);
