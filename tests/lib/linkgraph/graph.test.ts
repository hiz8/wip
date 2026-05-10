import { describe, expect, it } from "vitest";
import { attachBacklinks, buildBacklinks, type RenderedNoteDraft } from "@/lib/linkgraph/graph.ts";
import type { OutgoingLink } from "@/types/content.ts";

function draft(
  slug: string,
  updated: string,
  outgoing: OutgoingLink[],
  title = slug,
): RenderedNoteDraft {
  return {
    type: "notes",
    slug,
    filePath: `${slug}.md`,
    absolutePath: `/vault/${slug}.md`,
    frontmatter: {
      created: "2025-01-01T00:00:00+09:00",
      updated,
      status: "published",
    },
    body: "",
    html: "",
    title,
    toc: [],
    outgoingLinks: outgoing,
    footnotes: [],
    callouts: [],
    images: [],
  };
}

const link = (slug: string, embedded = false): OutgoingLink => ({
  type: "notes",
  slug,
  raw: slug,
  embedded,
});

describe("buildBacklinks", () => {
  it("逆引きインデックスを返し、updated 降順でソートされる", () => {
    const drafts = [
      draft("a", "2025-04-10T00:00:00+09:00", [link("target")]),
      draft("b", "2025-04-15T00:00:00+09:00", [link("target")]),
      draft("c", "2025-04-01T00:00:00+09:00", [link("target")]),
    ];
    const map = buildBacklinks(drafts);
    const refs = map.get("notes:target");
    expect(refs?.map((r) => r.slug)).toEqual(["b", "a", "c"]);
  });

  it("同一ソースから同じターゲットへの複数リンクは 1 件に集約", () => {
    const drafts = [
      draft("a", "2025-04-10T00:00:00+09:00", [link("target"), link("target", true)]),
    ];
    const map = buildBacklinks(drafts);
    expect(map.get("notes:target")?.length).toBe(1);
  });
});

describe("attachBacklinks", () => {
  it("各 draft に incomingLinks を付与する", () => {
    const drafts = [
      draft("a", "2025-04-10T00:00:00+09:00", [link("target")]),
      draft("target", "2025-04-01T00:00:00+09:00", []),
    ];
    const map = buildBacklinks(drafts);
    const result = attachBacklinks(drafts, map);
    const target = result.find((r) => r.slug === "target");
    expect(target?.incomingLinks.map((r) => r.slug)).toEqual(["a"]);
    const a = result.find((r) => r.slug === "a");
    expect(a?.incomingLinks).toEqual([]);
  });
});

describe("buildBacklinks (cross-type)", () => {
  it("Notes から Glossary / Books へのリンクが逆引きできる", () => {
    const noteDraft: RenderedNoteDraft = draft("note-a", "2025-04-10T00:00:00+09:00", [
      { type: "glossary", slug: "react-fiber", raw: "React Fiber", embedded: false },
      { type: "books", slug: "9784873119045", raw: "リファクタリング", embedded: false },
    ]);
    const map = buildBacklinks([noteDraft]);
    expect(map.get("glossary:react-fiber")?.[0]?.slug).toBe("note-a");
    expect(map.get("books/9784873119045")).toBeUndefined();
    expect(map.get("books:9784873119045")?.[0]?.slug).toBe("note-a");
  });
});
