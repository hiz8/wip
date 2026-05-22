import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { loadConfig } from "@/lib/config/load.ts";
import {
  __setSiteDatasetConfigForTests,
  __resetSiteDatasetForTests,
  getSiteDataset,
  type SiteDataset,
} from "@/server/datasets.ts";
import type { ImageMappingEntry } from "@/lib/images/index.ts";
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

  // In-content <img src> rewriting now happens in the SSR dataset build
  // (src/server/datasets.ts), so the prerendered HTML already references
  // /images/<publicPath>. Here we only need to copy the source files into dist.
  await copyImages(dataset.imageMapping);
  await Promise.all([writeSitemap(dataset), writeFeed(dataset)]);
  await runPagefind();

  console.log("[post-build] images, sitemap, feed, pagefind index written under dist/client/");
}

function runPagefind(): Promise<void> {
  return new Promise((resolveProcess, rejectProcess) => {
    const child = spawn("npx", ["pagefind", "--site", DIST_DIR], {
      stdio: "inherit",
      shell: false,
    });
    child.on("error", rejectProcess);
    child.on("exit", (code) => {
      if (code === 0) resolveProcess();
      else rejectProcess(new Error(`pagefind exited with code ${code ?? "null"}`));
    });
  });
}

async function copyImages(entries: readonly ImageMappingEntry[]): Promise<void> {
  if (entries.length === 0) return;
  await mkdir(IMAGES_DIR, { recursive: true });
  const missing: string[] = [];
  await Promise.all(
    entries.map(async (entry) => {
      const dest = join(DIST_DIR, entry.publicPath.replace(/^\//u, ""));
      try {
        await copyFile(entry.resolvedAbsolutePath, dest);
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          missing.push(entry.resolvedAbsolutePath);
          return;
        }
        throw error;
      }
    }),
  );
  if (missing.length > 0) {
    console.error("[post-build] missing image files:");
    for (const path of missing) console.error(`  - ${path}`);
    throw new Error(`${missing.length} referenced image file(s) not found`);
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
