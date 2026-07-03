import { describe, expect, it } from "vitest";
import { collectBlog } from "@/lib/content/index.ts";
import { renderBlog } from "@/lib/markdown/index.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("renderBlog", () => {
  it("記事ごとに anchorId 由来の id 名前空間でレンダリングする", async () => {
    const config = makeConfig("vault");
    const items = await collectBlog(config);
    const rendered = await renderBlog(items, config);
    const withFootnote = rendered.find((r) => r.slug === "2025-02-14 0930");
    expect(withFootnote).toBeDefined();
    // 脚注参照が記事固有の id 空間を指す
    expect(withFootnote!.html).toContain("#p-2025-02-14-0930-fn-");
    // Marginalia の data-side が付与されている (記事単位で document order 初期化)
    expect(withFootnote!.html).toContain('data-side="right"');
    // Blog はリンクの受け手にならない
    expect(rendered.every((r) => r.incomingLinks.length === 0)).toBe(true);
  });

  it("タイトルはタグ併記の正規形になる", async () => {
    const config = makeConfig("vault");
    const rendered = await renderBlog(await collectBlog(config), config);
    const top = rendered.find((r) => r.slug === "2025-12-11 0930");
    expect(top!.title).toBe("#UI-UX#マイクロコピー#ライティング");
  });
});
