import { z } from "zod";
import type { BaseFrontmatter, NotesFrontmatter, Status } from "@/types/content.ts";
import { BuildError } from "./errors.ts";

const statusSchema: z.ZodType<Status> = z.enum(["published", "draft", "archived"]);

const isoDateString = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString() : value),
  z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "must be a valid ISO 8601 date string",
  }),
);

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

export function validateNotesFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): NotesFrontmatter {
  const parsed = notesFrontmatterSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new BuildError({
      category: "invalid-frontmatter",
      filePath,
      field: issue ? issue.path.join(".") || undefined : undefined,
      message: formatZodIssues(parsed.error),
      cause: parsed.error,
    });
  }
  return applyDefaults(parsed.data);
}

function applyDefaults(parsed: z.infer<typeof notesFrontmatterSchema>): NotesFrontmatter {
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

export function isPublished(frontmatter: BaseFrontmatter): boolean {
  return (frontmatter.status ?? "published") === "published";
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}
