export type ContentType = "notes" | "glossary" | "books" | "blog";

export type Status = "published" | "draft" | "archived";

export interface BaseFrontmatter {
  status?: Status;
  tags?: string[];
  summary?: string;
  featured?: boolean;
  created?: string;
  updated?: string;
}

export interface NotesFrontmatter extends BaseFrontmatter {
  title?: string;
  created: string;
  updated: string;
}

export interface GlossaryFrontmatter extends BaseFrontmatter {
  term?: string;
  furigana?: string;
  aliases?: string[];
}

export interface BooksFrontmatter extends BaseFrontmatter {
  aliases: string[];
  authors: string[];
  isbn?: string;
  read_date?: string;
  pubYear?: number;
  publisher?: string;
  cover?: string;
}

// Blog は全メタデータ必須 + title / summary / featured / created を「持たない」
// (作成日時はファイル名が唯一の正)。BaseFrontmatter は全フィールド optional
// なので、この standalone 定義でも構造的に BaseFrontmatter へ代入可能。
export interface BlogFrontmatter {
  tags: string[];
  updated: string;
  status: Status;
}

export interface ContentItem<F extends BaseFrontmatter = BaseFrontmatter> {
  type: ContentType;
  slug: string;
  filePath: string;
  absolutePath: string;
  frontmatter: F;
  body: string;
}

export interface TocEntry {
  depth: 2 | 3;
  text: string;
  id: string;
}

export interface OutgoingLink {
  type: ContentType;
  slug: string;
  raw: string;
  embedded: boolean;
}

export interface BacklinkRef {
  type: ContentType;
  slug: string;
  title: string;
  updated: string;
}

export interface FootnoteEntry {
  id: string;
  label: string;
  html: string;
}

export type CalloutKind = "note" | "quote" | "tip" | "info" | "warning";

export interface CalloutEntry {
  id: string;
  kind: CalloutKind;
  title: string | undefined;
  html: string;
}

export interface ImageRef {
  rawPath: string;
  resolvedAbsolutePath: string;
}

export interface RenderedItem<F extends BaseFrontmatter = BaseFrontmatter> extends ContentItem<F> {
  html: string;
  title: string;
  toc: TocEntry[];
  outgoingLinks: OutgoingLink[];
  incomingLinks: BacklinkRef[];
  footnotes: FootnoteEntry[];
  callouts: CalloutEntry[];
  images: ImageRef[];
}

export type RenderedNote = RenderedItem<NotesFrontmatter>;
export type RenderedGlossaryTerm = RenderedItem<GlossaryFrontmatter>;
export type RenderedBook = RenderedItem<BooksFrontmatter>;
export type RenderedBlogArticle = RenderedItem<BlogFrontmatter>;
