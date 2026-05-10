import { describe, expect, it } from "vitest";
import { buildTree } from "@/lib/tree/buildTree.ts";
import { filterTree } from "@/lib/tree/filterTree.ts";

const sample = buildTree([
  { slug: "alpha", title: "Alpha Notes", filePath: "alpha.md" },
  { slug: "react", title: "React Hooks", filePath: "frontend/react.md" },
  { slug: "vue", title: "Vue Patterns", filePath: "frontend/vue.md" },
  { slug: "css", title: "CSS Tricks", filePath: "css.md" },
]);

describe("filterTree", () => {
  it("returns the original tree for empty query", () => {
    const result = filterTree(sample, "");
    expect(result.tree).toBe(sample);
    expect(result.matchedFolderIds).toEqual([]);
  });

  it("matches notes case-insensitively by title", () => {
    const result = filterTree(sample, "REACT");
    const flat = JSON.stringify(result.tree);
    expect(flat).toContain("React Hooks");
    expect(flat).not.toContain("Vue Patterns");
    expect(flat).not.toContain("CSS Tricks");
  });

  it("hides folders with no matching descendants", () => {
    const result = filterTree(sample, "alpha");
    expect(result.tree.find((n) => n.kind === "folder")).toBeUndefined();
  });

  it("includes parent folder when descendant matches", () => {
    const result = filterTree(sample, "vue");
    expect(result.tree.find((n) => n.kind === "folder" && n.name === "frontend")).toBeDefined();
  });

  it("matches a folder name and exposes its children", () => {
    const result = filterTree(sample, "frontend");
    const folder = result.tree.find((n) => n.kind === "folder" && n.name === "frontend");
    expect(folder).toBeDefined();
    if (folder?.kind === "folder") expect(folder.children).toHaveLength(2);
  });
});
