import { copyFile, mkdir, readdir, rename, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";
import { loadConfig } from "@/lib/config/load.ts";
import { decodeAssetSegment } from "@/lib/assets/decodePrerenderName.ts";
import {
  __setSiteDatasetConfigForTests,
  __resetSiteDatasetForTests,
  getSiteDataset,
  type SiteDataset,
} from "@/server/datasets.ts";
import type { ImageMappingEntry } from "@/lib/images/index.ts";
import { buildSitemapEntries, renderSitemapXml } from "@/lib/feed/sitemap.ts";
import { buildAtomEntries, renderAtomXml } from "@/lib/feed/atom.ts";
import { buildBlogFeedEntries, buildBlogSitemapPages } from "@/lib/feed/blogFeed.ts";
import { getBlogModel, type BlogModel } from "@/server/blog.ts";
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

  // SSR バンドルに焼き込まれた静的な `siteConfigInput` ではなく、スクリプト自身の
  // loadConfig (現在のシェル環境の VAULT_ROOT を尊重する) の下でフレッシュな
  // dataset ビルドを強制する。
  const config = await loadConfig();
  __resetSiteDatasetForTests();
  __setSiteDatasetConfigForTests(config);

  const dataset = await getSiteDataset();
  const blogModel = await getBlogModel();

  // コンテンツ内の <img src> 書き換えは今や SSR dataset ビルド
  // (src/server/datasets.ts) で行われるため、プリレンダー済みの HTML は既に
  // /images/<publicPath> を参照している。ここではソースファイルを dist へ
  // コピーするだけでよい。
  await copyImages(dataset.imageMapping);
  await Promise.all([
    writeSitemap(dataset, blogModel),
    writeFeed(dataset),
    writeBlogFeed(blogModel, config.content.blog.feedMaxItems),
  ]);
  await runPagefind();
  await decodePrerenderedPaths();

  console.log("[post-build] images, sitemap, feed, pagefind index written under dist/client/");
}

// URL 由来ではない名前を持つパイプライン成果物。これらの配下はデコード対象にしない
// (例: images/ は Vault の実ファイル名のコピーで、素の % を含み得る)。
const PIPELINE_ARTIFACT_DIRS = new Set(["assets", "images", "pagefind", "__tsr"]);

// prerender は crawlLinks の href をエンコード形のままディレクトリ名にするが、
// Cloudflare Static Assets はリクエストパスを一度デコードしてから照合するため、
// エンコード形の名前は 404 になる。ディスク名をデコード形へ揃える (Pagefind の後に
// 実行することで、生成済みリンクはエンコード形 = 正しい URL 表記のまま保たれる)。
// dist 直下のファイル (public/ 由来) は対象外。
async function decodePrerenderedPaths(): Promise<void> {
  const top = await readdir(DIST_DIR, { withFileTypes: true });
  let renamed = 0;
  for (const entry of top) {
    if (!entry.isDirectory() || PIPELINE_ARTIFACT_DIRS.has(entry.name)) continue;
    renamed += await decodeTreeInPlace(join(DIST_DIR, entry.name));
  }
  if (renamed > 0) {
    console.log(`[post-build] decoded ${renamed} prerendered path segment(s) for static hosting`);
  }
}

async function decodeTreeInPlace(dir: string): Promise<number> {
  let count = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const currentPath = join(dir, entry.name);
    // 子を先に処理してから自身をリネームする (post-order)。
    if (entry.isDirectory()) count += await decodeTreeInPlace(currentPath);
    const decoded = decodeAssetSegment(entry.name);
    if (decoded === null) continue;
    const target = join(dir, decoded);
    if (existsSync(target)) {
      throw new Error(
        `[post-build] decode collision: "${currentPath}" -> "${target}" は既に存在します。` +
          "スラッグのエンコード形と衝突する実ファイル名がないか確認してください。",
      );
    }
    await rename(currentPath, target);
    count += 1;
  }
  return count;
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

async function writeSitemap(dataset: SiteDataset, blogModel: BlogModel): Promise<void> {
  const entries = buildSitemapEntries(
    {
      notes: dataset.notes,
      glossary: dataset.glossary,
      books: dataset.books,
      blogPages: buildBlogSitemapPages(blogModel),
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

async function writeBlogFeed(blogModel: BlogModel, feedMaxItems: number): Promise<void> {
  const entries = buildBlogFeedEntries(blogModel, SITE_URL, feedMaxItems);
  const xml = renderAtomXml(
    {
      siteUrl: SITE_URL,
      siteName: SITE_NAME,
      description: SITE_DESCRIPTION,
      selfHref: `${SITE_URL}/blog/feed.xml`,
      language: SITE_LOCALE,
    },
    entries,
  );
  const blogDir = join(DIST_DIR, "blog");
  await mkdir(blogDir, { recursive: true });
  await writeFile(join(blogDir, "feed.xml"), xml, "utf8");
}

try {
  await main();
} catch (error: unknown) {
  console.error("[post-build] failed:", error);
  process.exitCode = 1;
}
