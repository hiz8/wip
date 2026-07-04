import { afterEach, describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { resolveConfig } from "@/lib/config/index.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import siteConfigInput from "../../site.config.ts";
import { __resetSiteDatasetForTests, __setSiteDatasetConfigForTests } from "@/server/datasets.ts";
import { projectHomePage } from "@/server/projectHomePage.ts";

const fixturesVault = resolve(__dirname, "../fixtures/vault");

function loadFixtureConfig(): SiteConfigParsed {
  const original = process.env["VAULT_ROOT"];
  process.env["VAULT_ROOT"] = fixturesVault;
  try {
    return resolveConfig(siteConfigInput, { loadEnv: false });
  } finally {
    if (original === undefined) delete process.env["VAULT_ROOT"];
    else process.env["VAULT_ROOT"] = original;
  }
}

describe("projectHomePage (home page loader)", () => {
  afterEach(() => {
    __resetSiteDatasetForTests();
  });

  it("最近更新は Notes/Glossary/Books/Blog を横断し updated 降順 上位 5 件を返す", async () => {
    __setSiteDatasetConfigForTests(loadFixtureConfig());
    const data = await projectHomePage();

    expect(data.recent).toHaveLength(5);
    // 公開かつ updated を持つ中で最新 (Blog 2025-12-11 0930 の updated 2025-12-20)。
    expect(data.recent[0]?.slug).toBe("2025-12-11 0930");
    expect(data.recent[0]?.type).toBe("blog");

    // すべて updated を持ち、降順であること。
    for (const item of data.recent) {
      expect(item.updated).not.toBe("");
    }
    const updatedValues = data.recent.map((item) => item.updated);
    const sorted = [...updatedValues].toSorted((a, b) => (a < b ? 1 : -1));
    expect(updatedValues).toEqual(sorted);

    // updated を持たない用語 (react-fiber) は最近更新から除外される。
    expect(data.recent.some((item) => item.slug === "react-fiber")).toBe(false);
  });

  it("件数は各タイプの公開コンテンツ数と一致する", async () => {
    __setSiteDatasetConfigForTests(loadFixtureConfig());
    const data = await projectHomePage();

    // draft / archived は除外済み (サブフォルダの frontend/nested.md を含む)。
    expect(data.counts.notes).toBe(5);
    expect(data.counts.glossary).toBe(4);
    expect(data.counts.books).toBe(3);
  });

  it("Featured は frontmatter featured:true のみを抽出する", async () => {
    __setSiteDatasetConfigForTests(loadFixtureConfig());
    const data = await projectHomePage();

    expect(data.featured).toHaveLength(1);
    expect(data.featured[0]?.slug).toBe("note-a");
    expect(data.featured[0]?.type).toBe("notes");
  });

  it("自己紹介本文 (_site/home.md) を HTML 化し wiki-link をフル解決する", async () => {
    __setSiteDatasetConfigForTests(loadFixtureConfig());
    const data = await projectHomePage();

    expect(data.introHtml).not.toBeNull();
    expect(data.introHtml).toContain('href="/notes/note-a"');
  });

  it("_site/about.md が存在しない場合は aboutHtml を null とする (graceful skip)", async () => {
    __setSiteDatasetConfigForTests(loadFixtureConfig());
    const data = await projectHomePage();

    expect(data.aboutHtml).toBeNull();
  });

  it("著者名は config.author.name を返す (スカイバナーのフッター用)", async () => {
    const base = loadFixtureConfig();
    const config: SiteConfigParsed = {
      ...base,
      author: { ...base.author, name: "テスト著者" },
    };
    __setSiteDatasetConfigForTests(config);
    const data = await projectHomePage();

    expect(data.authorName).toBe("テスト著者");
  });

  it("外部リンクは config の author.socialLinks をそのまま返す", async () => {
    const base = loadFixtureConfig();
    const config: SiteConfigParsed = {
      ...base,
      author: {
        ...base.author,
        socialLinks: [{ label: "GitHub", url: "https://github.com/example" }],
      },
    };
    __setSiteDatasetConfigForTests(config);
    const data = await projectHomePage();

    expect(data.socialLinks).toEqual([{ label: "GitHub", url: "https://github.com/example" }]);
  });

  it("最近更新に Blog 記事が updated 降順で混ざる", async () => {
    __setSiteDatasetConfigForTests(loadFixtureConfig());
    const data = await projectHomePage();

    const blogItem = data.recent.find((r) => r.type === "blog");
    expect(blogItem).toBeDefined();
    // updated 最新の Blog fixture。
    expect(blogItem!.title).toBe("#UI-UX#マイクロコピー#ライティング");
    expect(blogItem!.blogLink).toEqual({
      tagset: "UI-UX+マイクロコピー+ライティング",
      page: 1,
      anchorId: "p-2025-12-11-0930",
    });
  });

  it("コンテンツ入口の件数に blog が入る", async () => {
    __setSiteDatasetConfigForTests(loadFixtureConfig());
    const data = await projectHomePage();

    // published のみ。
    expect(data.counts.blog).toBe(5);
  });
});
