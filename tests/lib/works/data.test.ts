import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHIVED, WORKS, type Work } from "@/lib/works/data.ts";

const ALL: Work[] = [...WORKS, ...ARCHIVED];

describe("lib/works data", () => {
  it("WORKS と ARCHIVED を非空で公開する", () => {
    expect(WORKS.length).toBeGreaterThan(0);
    expect(ARCHIVED.length).toBeGreaterThan(0);
  });

  it("各エントリは title / description / 非空の urls を持つ", () => {
    for (const work of ALL) {
      expect(work.title.length).toBeGreaterThan(0);
      expect(work.description.length).toBeGreaterThan(0);
      expect(work.urls.length).toBeGreaterThan(0);
      for (const { type, url } of work.urls) {
        expect(["website", "github"]).toContain(type);
        expect(url).toMatch(/^https?:\/\//u);
      }
    }
  });

  it("image を持つエントリはファイルが public/ に実在する", () => {
    for (const work of ALL) {
      if (work.image === undefined) continue;
      const abs = join(process.cwd(), "public", work.image.replace(/^\//u, ""));
      expect(existsSync(abs), `missing image: ${work.image}`).toBe(true);
    }
  });

  it("title は WORKS + ARCHIVED を通して一意 (key 用途)", () => {
    const titles = ALL.map((w) => w.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
