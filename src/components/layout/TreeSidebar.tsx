import * as stylex from "@stylexjs/stylex";
import { useEffect, useMemo, useState } from "react";
import { type Key } from "react-aria-components";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import { findFolderAncestors } from "@/lib/tree/buildTree.ts";
import { filterTree } from "@/lib/tree/filterTree.ts";
import { ContentTree } from "@/components/tree/ContentTree.tsx";
import { TreeSearch } from "@/components/tree/TreeSearch.tsx";
import { space } from "@/styles/tokens.stylex.ts";
import type { ContentType } from "@/types/content.ts";

interface TreeSidebarProps {
  tree: readonly TreeNode[];
  activeSlug: string | null;
  treeKind: ContentType;
}

interface TreeKindCopy {
  ariaLabel: string;
  searchPlaceholder: string;
  searchAriaLabel: string;
  emptyMessage: string;
}

const COPY: Record<ContentType, TreeKindCopy> = {
  notes: {
    ariaLabel: "Notes",
    searchPlaceholder: "Filter notes…",
    searchAriaLabel: "Filter notes",
    emptyMessage: "No notes match.",
  },
  glossary: {
    ariaLabel: "Glossary",
    searchPlaceholder: "Filter terms…",
    searchAriaLabel: "Filter glossary terms",
    emptyMessage: "No terms match.",
  },
  books: {
    ariaLabel: "Books",
    searchPlaceholder: "Filter books…",
    searchAriaLabel: "Filter books",
    emptyMessage: "No books match.",
  },
};

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
    paddingInline: space.s3,
    paddingBlock: space.s4,
    maxHeight: "100vh",
    boxSizing: "border-box",
    overflowY: "auto",
    position: "sticky",
    top: 0,
  },
});

function collectAllFolderIds(nodes: readonly TreeNode[]): string[] {
  const out: string[] = [];
  const walk = (subset: readonly TreeNode[]) => {
    for (const node of subset) {
      if (node.kind === "folder") {
        out.push(node.id);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return out;
}

export function TreeSidebar({ tree, activeSlug, treeKind }: TreeSidebarProps) {
  const copy = COPY[treeKind];
  const [query, setQuery] = useState("");
  const initialExpanded = useMemo<string[]>(() => {
    return activeSlug === null ? [] : findFolderAncestors(tree, activeSlug);
  }, [tree, activeSlug]);
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => new Set<Key>(initialExpanded));

  const { tree: filteredTree, matchedFolderIds } = useMemo(
    () => filterTree(tree, query),
    [tree, query],
  );

  useEffect(() => {
    if (query.trim() === "") return;
    setExpandedKeys((prev) => {
      const next = new Set<Key>(prev);
      const ids =
        matchedFolderIds.length > 0 ? matchedFolderIds : collectAllFolderIds(filteredTree);
      let changed = false;
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [query, matchedFolderIds, filteredTree]);

  return (
    <div {...stylex.props(styles.root)}>
      <TreeSearch
        value={query}
        onChange={setQuery}
        placeholder={copy.searchPlaceholder}
        ariaLabel={copy.searchAriaLabel}
      />
      <ContentTree
        tree={filteredTree}
        expandedKeys={expandedKeys}
        onExpandedChange={setExpandedKeys}
        activeSlug={activeSlug}
        contentType={treeKind}
        ariaLabel={copy.ariaLabel}
        emptyMessage={copy.emptyMessage}
      />
    </div>
  );
}
