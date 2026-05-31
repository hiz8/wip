import * as stylex from "@stylexjs/stylex";
import { Collection, Tree, TreeItem, TreeItemContent, type Key } from "react-aria-components";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";
import type { ContentType } from "@/types/content.ts";

interface ContentTreeProps {
  tree: readonly TreeNode[];
  expandedKeys: ReadonlySet<Key>;
  onExpandedChange: (keys: Set<Key>) => void;
  activeSlug: string | null;
  contentType: ContentType;
  ariaLabel: string;
  emptyMessage: string;
}

const styles = stylex.create({
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
    // デザイン同様、選択行はテキスト色を primary に保ち、背景 + ウェイトで強調する
    // (accent をテキストにするとダークで selectedBg に対し AA を割る)。
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
  toggle: {
    display: "inline-flex",
    width: "1.25rem",
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    flexShrink: 0,
  },
  label: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
});

interface RenderNodeProps {
  node: TreeNode;
  level: number;
  activeSlug: string | null;
  contentType: ContentType;
}

function FolderRow({ name, isExpanded }: { name: string; isExpanded: boolean }) {
  return (
    <>
      <span aria-hidden="true" {...stylex.props(styles.toggle)}>
        {isExpanded ? "▾" : "▸"}
      </span>
      <span {...stylex.props(styles.label)}>{name}</span>
    </>
  );
}

function NoteRow({ title }: { title: string }) {
  return (
    <>
      <span aria-hidden="true" {...stylex.props(styles.toggle)} />
      <span {...stylex.props(styles.label)}>{title}</span>
    </>
  );
}

function FolderItem({
  node,
  level,
  activeSlug,
  contentType,
}: {
  node: Extract<TreeNode, { kind: "folder" }>;
  level: number;
  activeSlug: string | null;
  contentType: ContentType;
}) {
  return (
    <TreeItem id={node.id} textValue={node.name} {...stylex.props(styles.item(level))}>
      <TreeItemContent>
        {(renderProps) => (
          <div {...stylex.props(styles.row, renderProps.isFocusVisible && styles.rowFocused)}>
            <FolderRow name={node.name} isExpanded={renderProps.isExpanded} />
          </div>
        )}
      </TreeItemContent>
      <Collection items={node.children}>
        {(child) => (
          <RenderNode
            node={child}
            level={level + 1}
            activeSlug={activeSlug}
            contentType={contentType}
          />
        )}
      </Collection>
    </TreeItem>
  );
}

function NoteItem({
  node,
  level,
  activeSlug,
  contentType,
}: {
  node: Extract<TreeNode, { kind: "note" }>;
  level: number;
  activeSlug: string | null;
  contentType: ContentType;
}) {
  const isActive = activeSlug === node.slug;
  return (
    <TreeItem
      id={node.id}
      textValue={node.title}
      href={`/${contentType}/${node.slug}`}
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
            <NoteRow title={node.title} />
          </div>
        )}
      </TreeItemContent>
    </TreeItem>
  );
}

function RenderNode({ node, level, activeSlug, contentType }: RenderNodeProps) {
  return node.kind === "folder" ? (
    <FolderItem node={node} level={level} activeSlug={activeSlug} contentType={contentType} />
  ) : (
    <NoteItem node={node} level={level} activeSlug={activeSlug} contentType={contentType} />
  );
}

export function ContentTree({
  tree,
  expandedKeys,
  onExpandedChange,
  activeSlug,
  contentType,
  ariaLabel,
  emptyMessage,
}: ContentTreeProps) {
  if (tree.length === 0) {
    return <p {...stylex.props(styles.empty)}>{emptyMessage}</p>;
  }
  return (
    <Tree
      aria-label={ariaLabel}
      items={tree}
      expandedKeys={expandedKeys as Set<Key>}
      onExpandedChange={onExpandedChange}
      selectionMode="none"
      {...stylex.props(styles.tree)}
    >
      {(node) => (
        <RenderNode node={node} level={0} activeSlug={activeSlug} contentType={contentType} />
      )}
    </Tree>
  );
}
