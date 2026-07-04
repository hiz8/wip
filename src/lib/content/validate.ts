import { z } from "zod";
import type {
  BaseFrontmatter,
  BlogFrontmatter,
  BooksFrontmatter,
  GlossaryFrontmatter,
  NotesFrontmatter,
  Status,
} from "@/types/content.ts";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";
import { validateBlogTagToken } from "@/lib/blog/tagset.ts";
import { BuildError } from "./errors.ts";
import { deriveSlug } from "./slug.ts";

const statusSchema: z.ZodType<Status> = z.enum(["published", "draft", "archived"]);

const isoDateString = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "must be a valid ISO 8601 date string",
  }),
);

// Obsidian のプロパティ機能は数値を文字列としてクォート保存することがある (例: `pubYear: "2013"`)。
// 数値として解釈できる文字列は数値へ正規化する。解釈できない文字列はそのまま渡し、型不一致エラーとする。
const yearNumber = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return value;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}, z.number().int());

const baseFrontmatterShape = {
  status: statusSchema.optional(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  featured: z.boolean().optional(),
  created: isoDateString.optional(),
  updated: isoDateString.optional(),
};

const notesFrontmatterSchema = z.object({
  ...baseFrontmatterShape,
  title: z.string().optional(),
  created: isoDateString,
  updated: isoDateString,
});

const glossaryFrontmatterSchema = z.object({
  ...baseFrontmatterShape,
  term: z.string().optional(),
  furigana: z.string().optional(),
  aliases: z.array(z.string()).optional(),
});

const booksFrontmatterSchema = z.object({
  ...baseFrontmatterShape,
  aliases: z.array(z.string()).min(1, "must have at least one alias"),
  authors: z.array(z.string()).min(1, "must have at least one author"),
  isbn: z.string().optional(),
  read_date: isoDateString.optional(),
  pubYear: yearNumber.optional(),
  publisher: z.string().optional(),
  cover: z.string().optional(),
});

// Blog で「持たない」と定義したキー。混入は二重管理 (特に created) の温床になるため
// 黙って無視せずビルドエラーにする (docs/blog-spec.md「実装時に確定した事項」)。
const BLOG_FORBIDDEN_KEYS = ["title", "summary", "featured", "created"] as const;

const blogFrontmatterSchema = z.object({
  tags: z
    .array(z.string())
    .min(1, "tags は 1 個以上必要です")
    .max(4, "タグは 1 記事あたり最大 4 トークンです"),
  updated: isoDateString,
  status: statusSchema,
});

// YAML は `key:` (値なし) を null として扱う。そうしたフィールドを欠損とみなし、optional スキーマが受理できるようにする。
function stripNulls(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== null) out[key] = value;
  }
  return out;
}

export function validateNotesFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): NotesFrontmatter {
  const parsed = notesFrontmatterSchema.safeParse(stripNulls(raw));
  if (!parsed.success) {
    throw frontmatterError(parsed.error, filePath);
  }
  return applyNotesDefaults(parsed.data);
}

export function validateGlossaryFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): GlossaryFrontmatter {
  const parsed = glossaryFrontmatterSchema.safeParse(stripNulls(raw));
  if (!parsed.success) {
    throw frontmatterError(parsed.error, filePath);
  }
  return applyGlossaryDefaults(parsed.data);
}

export function validateBooksFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): BooksFrontmatter {
  const parsed = booksFrontmatterSchema.safeParse(stripNulls(raw));
  if (!parsed.success) {
    throw frontmatterError(parsed.error, filePath);
  }
  return applyBooksDefaults(parsed.data);
}

export function validateBlogFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): BlogFrontmatter {
  // stripNulls 前に検査する: `created:` (値なし = null) のような書き方も混入として扱う
  for (const key of BLOG_FORBIDDEN_KEYS) {
    if (key in raw) {
      throw new BuildError({
        category: "invalid-frontmatter",
        filePath,
        field: key,
        message: `Blog は ${key} を持ちません (${key === "created" ? "作成日時はファイル名が唯一の正です" : "docs/blog-spec.md 参照"})`,
      });
    }
  }

  const slug = deriveSlug(filePath);
  if (parseBlogSlugDate(slug, "+00:00") === null) {
    throw new BuildError({
      category: "invalid-frontmatter",
      filePath,
      message: `Blog のファイル名は "YYYY-MM-DD HHmm.md" 形式の実在日時である必要があります (例: "2025-12-11 0930.md")`,
    });
  }

  const parsed = blogFrontmatterSchema.safeParse(stripNulls(raw));
  if (!parsed.success) throw frontmatterError(parsed.error, filePath);

  for (const token of parsed.data.tags) {
    const issue = validateBlogTagToken(token);
    if (issue !== null) {
      throw new BuildError({
        category: "invalid-frontmatter",
        filePath,
        field: "tags",
        message: issue,
      });
    }
  }

  return parsed.data;
}

function applyNotesDefaults(parsed: z.infer<typeof notesFrontmatterSchema>): NotesFrontmatter {
  const result: NotesFrontmatter = {
    created: parsed.created,
    updated: parsed.updated,
    status: parsed.status ?? "published",
  };
  if (parsed.title !== undefined) result.title = parsed.title;
  if (parsed.tags !== undefined) result.tags = parsed.tags;
  if (parsed.summary !== undefined) result.summary = parsed.summary;
  if (parsed.featured !== undefined) result.featured = parsed.featured;
  return result;
}

function applyGlossaryDefaults(
  parsed: z.infer<typeof glossaryFrontmatterSchema>,
): GlossaryFrontmatter {
  const result: GlossaryFrontmatter = {
    status: parsed.status ?? "published",
  };
  if (parsed.term !== undefined) result.term = parsed.term;
  if (parsed.furigana !== undefined) result.furigana = parsed.furigana;
  if (parsed.aliases !== undefined) result.aliases = parsed.aliases;
  if (parsed.tags !== undefined) result.tags = parsed.tags;
  if (parsed.summary !== undefined) result.summary = parsed.summary;
  if (parsed.featured !== undefined) result.featured = parsed.featured;
  if (parsed.created !== undefined) result.created = parsed.created;
  if (parsed.updated !== undefined) result.updated = parsed.updated;
  return result;
}

function applyBooksDefaults(parsed: z.infer<typeof booksFrontmatterSchema>): BooksFrontmatter {
  const result: BooksFrontmatter = {
    aliases: parsed.aliases,
    authors: parsed.authors,
    status: parsed.status ?? "published",
  };
  if (parsed.isbn !== undefined) result.isbn = parsed.isbn;
  if (parsed.read_date !== undefined) result.read_date = parsed.read_date;
  if (parsed.pubYear !== undefined) result.pubYear = parsed.pubYear;
  if (parsed.publisher !== undefined) result.publisher = parsed.publisher;
  if (parsed.cover !== undefined) result.cover = parsed.cover;
  if (parsed.tags !== undefined) result.tags = parsed.tags;
  if (parsed.summary !== undefined) result.summary = parsed.summary;
  if (parsed.featured !== undefined) result.featured = parsed.featured;
  if (parsed.created !== undefined) result.created = parsed.created;
  if (parsed.updated !== undefined) result.updated = parsed.updated;
  return result;
}

export function isPublished(frontmatter: BaseFrontmatter): boolean {
  return (frontmatter.status ?? "published") === "published";
}

function frontmatterError(error: z.ZodError, filePath: string): BuildError {
  const issue = error.issues[0];
  return new BuildError({
    category: "invalid-frontmatter",
    filePath,
    field: issue ? issue.path.join(".") || undefined : undefined,
    message: formatZodIssues(error),
    cause: error,
  });
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}
