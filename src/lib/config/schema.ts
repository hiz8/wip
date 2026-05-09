import { z } from "zod";

const urlString = z.string().refine(
  (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "must be a valid URL" },
);

const socialLinkSchema = z.object({
  label: z.string().min(1),
  url: urlString,
  icon: z.string().optional(),
});

const siteSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  url: urlString,
  locale: z.string().min(1),
  ogImage: z.string().optional(),
});

const authorSchema = z.object({
  name: z.string().min(1),
  bio: z.string().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
});

const notesContentSchema = z.object({
  path: z.string().default("."),
  exclude: z.array(z.string()).default(["Glossary/**", "Books/**", "Clips/**", "_site/**"]),
});

const glossaryContentSchema = z.object({
  path: z.string().default("Glossary"),
});

const booksContentSchema = z.object({
  path: z.string().default("Books"),
});

const contentSchema = z.object({
  vaultRoot: z.string().min(1, "content.vaultRoot must not be empty"),
  notes: notesContentSchema.prefault({}),
  glossary: glossaryContentSchema.prefault({}),
  books: booksContentSchema.prefault({}),
});

const pagesSchema = z
  .object({
    home: z
      .object({
        introMarkdown: z.string().optional(),
        aboutMarkdown: z.string().optional(),
      })
      .optional(),
  })
  .optional();

const buildSchema = z
  .object({
    outDir: z.string().default("dist"),
    publicDir: z.string().default("public"),
    strict: z.boolean().default(true),
  })
  .prefault({});

const featuresSchema = z
  .object({
    rss: z.boolean().default(true),
    sitemap: z.boolean().default(true),
    search: z.boolean().default(true),
  })
  .prefault({});

export const siteConfigSchema = z.object({
  site: siteSchema,
  author: authorSchema,
  content: contentSchema,
  pages: pagesSchema,
  build: buildSchema,
  features: featuresSchema,
});

export type SiteConfigParsed = z.infer<typeof siteConfigSchema>;
