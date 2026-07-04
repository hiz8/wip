import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import {
  Button,
  Collection,
  Tree,
  TreeItem,
  TreeItemContent,
  type Key,
} from "react-aria-components";
import { Link } from "@tanstack/react-router";
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
    // ラベルは <a> (TanStack Link)。行の色をそのまま継ぎ、既定リンク装飾は消す。
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
    color: "inherit",
    textDecoration: "none",
    // ネイティブ tabbable な <a>。ブラウザ既定アウトラインに委ねず、chevronFocused と
    // 同じフォーカスリングを与える (row/chevron とフォーカス表現をそろえる)。
    outlineWidth: { default: 0, ":focus-visible": 2 },
    outlineStyle: { default: "none", ":focus-visible": "solid" },
    outlineColor: colors.focusRing,
    outlineOffset: "1px",
    borderRadius: radius.sm,
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
  // react-perf(jsx-no-new-object-as-prop) を満たすため params は node ごとに memo 化する。
  const tagsetParams = useMemo(() => ({ tagset: node.tagset }), [node.tagset]);
  return (
    <TreeItem
      id={node.id}
      textValue={node.label}
      // TreeItem 自体は非ナビゲーショナル。可視ラベルを実 <a href> (TanStack Link) にして
      // SSG の crawlLinks に tagset ページを発見させる。RAC の href だと data-href の JS
      // ナビゲーションになりクローラが辿れない。開閉は独立して chevron ボタンに委ねる。
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
                実アンカーのラベルに付与して現在ページを AT に伝える。 */}
            <Link
              to="/blog/tags/$tagset"
              params={tagsetParams}
              aria-current={isActive ? "page" : undefined}
              {...stylex.props(styles.label)}
            >
              {node.label}
            </Link>
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

  // ユーザー保存集合と、直近レンダーで Tree へ渡した集合 (= effectiveExpanded) を
  // イベントハンドラから参照するための ref。onExpandedChange はレンダー後に発火するため、
  // effect でコミット後の値を追従させれば handler は最新値を読める。
  const expandedRef = useRef(expandedKeys);
  const effectiveRef = useRef<Set<Key>>(expandedKeys);

  // フィルタ中の chevron 操作でも matchedIds を保存集合へ焼き込まないよう、直近 effective 集合
  // との差分だけをユーザー集合へ適用する (added を足し、removed を引く)。保存も差分適用後の
  // ユーザー集合のみ。クエリ空時は effective === expanded なので keys をそのまま保存する従来挙動と等価。
  const handleExpandedChange = useCallback((keys: Set<Key>) => {
    const prevEffective = effectiveRef.current;
    const nextUser = new Set<Key>(expandedRef.current);
    for (const key of keys) if (!prevEffective.has(key)) nextUser.add(key);
    for (const key of prevEffective) if (!keys.has(key)) nextUser.delete(key);
    expandedRef.current = nextUser;
    setExpandedKeys(nextUser);
    saveTreeExpansion(new Set([...nextUser].map(String)));
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

  useEffect(() => {
    expandedRef.current = expandedKeys;
  }, [expandedKeys]);
  useEffect(() => {
    effectiveRef.current = effectiveExpanded;
  }, [effectiveExpanded]);

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
