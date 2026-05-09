export type ContentType = "notes" | "glossary" | "books";

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

export interface ContentItem<F extends BaseFrontmatter = BaseFrontmatter> {
  type: ContentType;
  slug: string;
  filePath: string;
  absolutePath: string;
  frontmatter: F;
  body: string;
}
