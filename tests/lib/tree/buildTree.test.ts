import { describe, expect, it } from "vitest";
import { buildTree, findFolderAncestors } from "@/lib/tree/buildTree.ts";

describe("buildTree", () => {
  it("builds a flat list of notes when no folders are present", () => {
    const tree = buildTree([
      { slug: "alpha", title: "Alpha", filePath: "alpha.md" },
      { slug: "beta", title: "Beta", filePath: "beta.md" },
    ]);
    expect(tree).toHaveLength(2);
    expect(tree.every((n) => n.kind === "note")).toBe(true);
  });

  it("groups notes by folder hierarchy", () => {
    const tree = buildTree([
      { slug: "intro", title: "Intro", filePath: "intro.md" },
      { slug: "react", title: "React", filePath: "frontend/react.md" },
      { slug: "vue", title: "Vue", filePath: "frontend/vue.md" },
      { slug: "deep", title: "Deep", filePath: "frontend/state/deep.md" },
    ]);
    const folder = tree.find((n) => n.kind === "folder" && n.name === "frontend");
    expect(folder).toBeDefined();
    if (folder?.kind !== "folder") throw new Error("expected folder");
    expect(folder.children.some((c) => c.kind === "folder" && c.name === "state")).toBe(true);
  });

  it("sorts folders before notes and respects locale ordering", () => {
    const tree = buildTree([
      { slug: "z-note", title: "Zebra", filePath: "z-note.md" },
      { slug: "a-note", title: "Apple", filePath: "a-note.md" },
      { slug: "deep", title: "Deep", filePath: "frontend/deep.md" },
    ]);
    expect(tree[0]?.kind).toBe("folder");
    if (tree[1]?.kind === "note") expect(tree[1].title).toBe("Apple");
  });

  it("falls back to slug if title is empty", () => {
    const [first] = buildTree([{ slug: "abc", title: "", filePath: "abc.md" }]);
    if (first?.kind !== "note") throw new Error("expected note");
    expect(first.title).toBe("abc");
  });
});

describe("findFolderAncestors", () => {
  const tree = buildTree([
    { slug: "intro", title: "Intro", filePath: "intro.md" },
    { slug: "deep", title: "Deep", filePath: "frontend/state/deep.md" },
  ]);

  it("returns ids of folder ancestors of a slug", () => {
    expect(findFolderAncestors(tree, "deep")).toEqual(["folder:frontend", "folder:frontend/state"]);
  });

  it("returns empty for unknown slug", () => {
    expect(findFolderAncestors(tree, "missing")).toEqual([]);
  });

  it("returns empty for top-level note", () => {
    expect(findFolderAncestors(tree, "intro")).toEqual([]);
  });
});
