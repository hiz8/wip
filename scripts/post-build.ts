import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { loadConfig } from "@/lib/config/load.ts";
import {
  __setSiteDatasetConfigForTests,
  __resetSiteDatasetForTests,
  getSiteDataset,
  type SiteDataset,
} from "@/server/datasets.ts";
import type { ImageMappingEntry } from "@/lib/images/index.ts";
import { isExternalImagePath, rewriteImgSrcInHtml } from "@/lib/images/index.ts";
import { buildSitemapEntries, renderSitemapXml } from "@/lib/feed/sitemap.ts";
import { buildAtomEntries, renderAtomXml } from "@/lib/feed/atom.ts";
import {
  FEED_MAX_ITEMS,
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/config/static.ts";

const DIST_DIR = resolve(process.cwd(), "dist", "client");
const IMAGES_DIR = join(DIST_DIR, "images");

async function main(): Promise<void> {
  if (!existsSync(DIST_DIR)) {
    throw new Error(
      `dist/client not found at ${DIST_DIR}. Run vite build before scripts/post-build.ts.`,
    );
  }

  // Force a fresh dataset build under the script's own loadConfig (which
  // honors VAULT_ROOT in the current shell environment) rather than the
  // static `siteConfigInput` baked into the SSR bundle.
  const config = await loadConfig();
  __resetSiteDatasetForTests();
  __setSiteDatasetConfigForTests(config);

  const dataset = await getSiteDataset();

  await copyImages(dataset.imageMapping);
  await rewriteHtmlFiles(dataset);
  await writeSitemap(dataset);
  await writeFeed(dataset);

  console.log("[post-build] images, sitemap, feed written under dist/client/");
}

async function copyImages(entries: readonly ImageMappingEntry[]): Promise<void> {
  if (entries.length === 0) return;
  await mkdir(IMAGES_DIR, { recursive: true });
  const missing: string[] = [];
  for (const entry of entries) {
    if (!existsSync(entry.resolvedAbsolutePath)) {
      missing.push(entry.resolvedAbsolutePath);
      continue;
    }
    const dest = join(DIST_DIR, entry.publicPath.replace(/^\//u, ""));
    await mkdir(dirname(dest), { recursive: true });
    await copyFile(entry.resolvedAbsolutePath, dest);
  }
  if (missing.length > 0) {
    console.error("[post-build] missing image files:");
    for (const path of missing) console.error(`  - ${path}`);
    throw new Error(`${missing.length} referenced image file(s) not found`);
  }
}

async function rewriteHtmlFiles(dataset: SiteDataset): Promise<void> {
  const resolvedToPublic = new Map<string, string>();
  for (const entry of dataset.imageMapping) {
    resolvedToPublic.set(entry.resolvedAbsolutePath, entry.publicPath);
  }

  const rewriteOne = async (
    slugPath: string,
    images: ReadonlyArray<{ rawPath: string; resolvedAbsolutePath: string }>,
  ): Promise<void> => {
    const htmlPath = join(DIST_DIR, slugPath, "index.html");
    if (!existsSync(htmlPath)) return;
    const map = new Map<string, string>();
    for (const img of images) {
      if (isExternalImagePath(img.rawPath)) continue;
      const publicPath = resolvedToPublic.get(img.resolvedAbsolutePath);
      if (publicPath !== undefined) map.set(img.rawPath, publicPath);
    }
    if (map.size === 0) return;
    const html = await readFile(htmlPath, "utf8");
    const rewritten = rewriteImgSrcInHtml(html, map);
    if (rewritten !== html) await writeFile(htmlPath, rewritten, "utf8");
  };

  for (const note of dataset.notes) {
    await rewriteOne(`notes/${note.slug}`, note.images);
  }
  for (const term of dataset.glossary) {
    await rewriteOne(`glossary/${term.slug}`, term.images);
  }
  for (const book of dataset.books) {
    await rewriteOne(`books/${book.slug}`, book.images);
  }
}

async function writeSitemap(dataset: SiteDataset): Promise<void> {
  const entries = buildSitemapEntries(
    {
      notes: dataset.notes,
      glossary: dataset.glossary,
      books: dataset.books,
    },
    SITE_URL,
  );
  const xml = renderSitemapXml(entries);
  await writeFile(join(DIST_DIR, "sitemap.xml"), xml, "utf8");
}

async function writeFeed(dataset: SiteDataset): Promise<void> {
  const entries = buildAtomEntries(
    {
      notes: dataset.notes,
      glossary: dataset.glossary,
      books: dataset.books,
    },
    SITE_URL,
    FEED_MAX_ITEMS,
  );
  const xml = renderAtomXml(
    {
      siteUrl: SITE_URL,
      siteName: SITE_NAME,
      description: SITE_DESCRIPTION,
      selfHref: `${SITE_URL}/feed.xml`,
      language: SITE_LOCALE,
    },
    entries,
  );
  await writeFile(join(DIST_DIR, "feed.xml"), xml, "utf8");
}

try {
  await main();
} catch (error: unknown) {
  console.error("[post-build] failed:", error);
  process.exitCode = 1;
}
