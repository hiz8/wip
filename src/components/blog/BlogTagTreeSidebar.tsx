import { useCallback, useMemo, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  Button,
  Collection,
  Tree,
  TreeItem,
  TreeItemContent,
  type Key,
} from "react-aria-components";
import { TreeSearch } from "@/components/tree/TreeSearch.tsx";
import { canonicalChainIds, filterBlogTree, type BlogTreeNode } from "@/lib/blog/tree.ts";
import { decodeTagset } from "@/lib/blog/tagset.ts";
import { loadTreeExpansion, saveTreeExpansion } from "@/lib/blog/treeExpansion.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface BlogTagTreeSidebarProps {
  tree: readonly BlogTreeNode[];
  /** 現在ページの正規 tagset。トップ (/blog) は null */
  currentTagset: string | null;
}

// 見た目は ContentTree の styles を踏襲する (インデント・行スタイル・選択色)。
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
  tree: {
    display: "flex",
    flexDirection: "column",
    fontSize: typography.fontSizeSm,
    color: colors.textPrimary,
    outlineStyle: "none",
  },
  empty: {
    color: colors.textMuted,
    paddingInline: space.s3,
    paddingBlock: space.s2,
    fontSize: typography.fontSizeSm,
  },
  item: (level: number) => ({
    display: "block",
    outlineStyle: "none",
    paddingInlineStart: `calc(${level} * ${space.s3} + ${space.s1})`,
  }),
  row: {
    display: "flex",
    alignItems: "center",
    gap: space.s1,
    paddingInline: space.s2,
    paddingBlock: space.s1,
    borderRadius: radius.sm,
    color: colors.textSecondary,
    cursor: "pointer",
    backgroundColor: { default: "transparent", ":hover": colors.hoverBg },
  },
  rowSelected: {
    // ContentTree と同様、選択行はテキスト色を primary に保ち背景 + ウェイトで強調する。
    color: colors.textPrimary,
    backgroundColor: colors.selectedBg,
    fontWeight: typography.weightMedium,
  },
  rowFocused: {
    outlineWidth: 2,
    outlineStyle: "solid",
    outlineColor: colors.focusRing,
    outlineOffset: "-2px",
  },
  // chevron はネイティブ button の装飾を消し、ContentTree の toggle span と同じ見た目にする。
  chevron: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.25rem",
    flexShrink: 0,
    padding: 0,
    margin: 0,
    borderStyle: "none",
    backgroundColor: "transparent",
    color: colors.textMuted,
    fontSize: typography.fontSizeXs,
    lineHeight: 1,
    cursor: "pointer",
    outlineStyle: "none",
  },
  chevronFocused: {
    outlineWidth: 2,
    outlineStyle: "solid",
    outlineColor: colors.focusRing,
    outlineOffset: "1px",
    borderRadius: radius.sm,
  },
  toggleSpacer: {
    display: "inline-flex",
    width: "1.25rem",
    flexShrink: 0,
  },
  label: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
});

function BlogTreeItem({
  node,
  level,
  currentTagset,
}: {
  node: BlogTreeNode;
  level: number;
  currentTagset: string | null;
}) {
  const isActive = node.tagset === currentTagset;
  const hasChildren = node.children.length > 0;
  return (
    <TreeItem
      id={node.id}
      textValue={node.label}
      // 行全体が正規形ページへのリンク。開閉は chevron ボタンに委ね、リンクとは独立させる
      // (RAC は href を data-href の JS ナビゲーションに変換し、chevron の usePress は
      // 伝播を止めるため chevron クリックで遷移しない)。
      href={`/blog/tags/${node.tagset}`}
      {...stylex.props(styles.item(level))}
    >
      <TreeItemContent>
        {(renderProps) => (
          <div
            {...stylex.props(
              styles.row,
              isActive && styles.rowSelected,
              renderProps.isFocusVisible && styles.rowFocused,
            )}
          >
            {hasChildren ? (
              <Button
                // slot="chevron" で RAC の展開ボタン (aria-label 付き) として機能する
                slot="chevron"
                {...stylex.props(
                  styles.chevron,
                  renderProps.isFocusVisibleWithin && styles.chevronFocused,
                )}
              >
                {renderProps.isExpanded ? "▾" : "▸"}
              </Button>
            ) : (
              <span aria-hidden="true" {...stylex.props(styles.toggleSpacer)} />
            )}
            {/* aria-current は row 要素に乗せられない (filterDOMProps が弾く) ため、
                行の可視ラベルに付与して現在ページを AT に伝える。 */}
            <span aria-current={isActive ? "page" : undefined} {...stylex.props(styles.label)}>
              {node.label}
            </span>
          </div>
        )}
      </TreeItemContent>
      {hasChildren && (
        <Collection items={node.children}>
          {(child) => <BlogTreeItem node={child} level={level + 1} currentTagset={currentTagset} />}
        </Collection>
      )}
    </TreeItem>
  );
}

export function BlogTagTreeSidebar({ tree, currentTagset }: BlogTagTreeSidebarProps) {
  const [query, setQuery] = useState("");

  // コールド読み込み時のみ正規チェーンを既定展開。以後はモジュールストアの保存分を復元し、
  // ルート遷移 (remount) をまたいでユーザーの開閉操作を保持する。
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => {
    const restored = loadTreeExpansion();
    if (restored) return new Set<Key>(restored);
    if (currentTagset === null) return new Set<Key>();
    return new Set<Key>(canonicalChainIds(tree, decodeTagset(currentTagset)));
  });

  const handleExpandedChange = useCallback((keys: Set<Key>) => {
    setExpandedKeys(keys);
    saveTreeExpansion(new Set([...keys].map(String)));
  }, []);

  const { tree: visibleTree, matchedIds } = useMemo(
    () => filterBlogTree(tree, query),
    [tree, query],
  );

  // フィルタ中は一致ノードの祖先 (matchedIds) を自動展開 (ユーザー保存分と合成)。
  const effectiveExpanded = useMemo(
    () => (query.trim() === "" ? expandedKeys : new Set<Key>([...expandedKeys, ...matchedIds])),
    [expandedKeys, matchedIds, query],
  );

  return (
    <div {...stylex.props(styles.root)}>
      <TreeSearch
        value={query}
        onChange={setQuery}
        placeholder="Filter tags"
        ariaLabel="Filter blog tags"
      />
      {visibleTree.length === 0 ? (
        <p {...stylex.props(styles.empty)}>No tags</p>
      ) : (
        <Tree
          aria-label="Blog tags"
          items={visibleTree}
          expandedKeys={effectiveExpanded}
          onExpandedChange={handleExpandedChange}
          selectionMode="none"
          {...stylex.props(styles.tree)}
        >
          {(node) => <BlogTreeItem node={node} level={0} currentTagset={currentTagset} />}
        </Tree>
      )}
    </div>
  );
}
