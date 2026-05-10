import type { TreeNode } from "./buildTree.ts";

export interface FilterTreeResult {
  tree: TreeNode[];
  matchedFolderIds: string[];
}

function collectFolderIds(nodes: readonly TreeNode[], out: string[]): void {
  for (const node of nodes) {
    if (node.kind === "folder") {
      out.push(node.id);
      collectFolderIds(node.children, out);
    }
  }
}

function filterNodes(
  nodes: readonly TreeNode[],
  needle: string,
  matchedFolders: string[],
): TreeNode[] {
  const result: TreeNode[] = [];
  for (const node of nodes) {
    if (node.kind === "note") {
      if (node.title.toLowerCase().includes(needle)) {
        result.push(node);
      }
    } else {
      const folderMatches = node.name.toLowerCase().includes(needle);
      const filteredChildren = filterNodes(node.children, needle, matchedFolders);
      if (folderMatches || filteredChildren.length > 0) {
        const childrenToShow = folderMatches ? node.children : filteredChildren;
        result.push({
          kind: "folder",
          id: node.id,
          name: node.name,
          path: node.path,
          children: childrenToShow,
        });
        matchedFolders.push(node.id);
        if (folderMatches) {
          collectFolderIds(node.children, matchedFolders);
        }
      }
    }
  }
  return result;
}

export function filterTree(tree: readonly TreeNode[], query: string): FilterTreeResult {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === "") {
    return { tree: tree as TreeNode[], matchedFolderIds: [] };
  }
  const matchedFolderIds: string[] = [];
  const filtered = filterNodes(tree, trimmed, matchedFolderIds);
  return { tree: filtered, matchedFolderIds };
}
