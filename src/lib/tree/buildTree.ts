import type { RenderedNote } from "@/types/content.ts";

export interface TreeFolderNode {
  kind: "folder";
  id: string;
  name: string;
  path: string;
  children: TreeNode[];
}

export interface TreeNoteNode {
  kind: "note";
  id: string;
  slug: string;
  title: string;
  path: string;
}

export type TreeNode = TreeFolderNode | TreeNoteNode;

interface FolderAccumulator {
  byPath: Map<string, TreeFolderNode>;
  root: TreeNode[];
}

function ensureFolder(acc: FolderAccumulator, segments: string[]): TreeNode[] {
  if (segments.length === 0) return acc.root;
  let parentChildren = acc.root;
  let cumulative = "";
  for (const segment of segments) {
    cumulative = cumulative === "" ? segment : `${cumulative}/${segment}`;
    let folder = acc.byPath.get(cumulative);
    if (!folder) {
      folder = {
        kind: "folder",
        id: `folder:${cumulative}`,
        name: segment,
        path: cumulative,
        children: [],
      };
      acc.byPath.set(cumulative, folder);
      parentChildren.push(folder);
    }
    parentChildren = folder.children;
  }
  return parentChildren;
}

function nodeLabel(node: TreeNode): string {
  return node.kind === "folder" ? node.name : node.title;
}

function sortNodes(nodes: TreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === "folder" ? -1 : 1;
    }
    return nodeLabel(a).localeCompare(nodeLabel(b), "ja");
  });
  for (const node of nodes) {
    if (node.kind === "folder") sortNodes(node.children);
  }
}

interface BuildTreeInput {
  slug: string;
  title: string;
  filePath: string;
}

export function buildTree(notes: readonly BuildTreeInput[]): TreeNode[] {
  const acc: FolderAccumulator = { byPath: new Map(), root: [] };

  for (const note of notes) {
    const normalized = note.filePath.replace(/^\/+/u, "").replaceAll("\\", "/");
    const segments = normalized.split("/").filter(Boolean);
    const folderSegments = segments.slice(0, -1);
    const fileSegment = segments.at(-1) ?? note.slug;
    const containing = ensureFolder(acc, folderSegments);
    const path =
      folderSegments.length === 0 ? fileSegment : `${folderSegments.join("/")}/${fileSegment}`;
    const noteNode: TreeNoteNode = {
      kind: "note",
      id: `note:${note.slug}`,
      slug: note.slug,
      title: (note.title || "").trim() === "" ? note.slug : note.title,
      path,
    };
    containing.push(noteNode);
  }

  sortNodes(acc.root);
  return acc.root;
}

export function buildTreeFromRenderedNotes(notes: readonly RenderedNote[]): TreeNode[] {
  return buildTree(
    notes.map((n) => ({
      slug: n.slug,
      title: n.title,
      filePath: n.filePath,
    })),
  );
}

export interface FolderAncestorsResult {
  ancestors: string[];
}

export function findFolderAncestors(tree: readonly TreeNode[], slug: string): string[] {
  const ancestors: string[] = [];
  const stack: { nodes: readonly TreeNode[]; trail: string[] }[] = [{ nodes: tree, trail: [] }];
  while (stack.length > 0) {
    const frame = stack.pop();
    if (!frame) break;
    for (const node of frame.nodes) {
      if (node.kind === "note") {
        if (node.slug === slug) {
          ancestors.push(...frame.trail);
          return ancestors;
        }
      } else {
        stack.push({ nodes: node.children, trail: [...frame.trail, node.id] });
      }
    }
  }
  return ancestors;
}
