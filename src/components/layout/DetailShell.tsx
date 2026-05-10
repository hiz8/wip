import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "./AppShell.tsx";
import { DetailLayout } from "./DetailLayout.tsx";
import { RightSidebar } from "./RightSidebar.tsx";
import { TreeSidebar } from "./TreeSidebar.tsx";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import type { BacklinkRef, ContentType, TocEntry } from "@/types/content.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

type DetailBackTo = "/notes" | "/glossary" | "/books";

interface DetailShellProps {
  tree: readonly TreeNode[];
  treeKind: ContentType;
  activeSlug: string;
  toc: readonly TocEntry[];
  backlinks: readonly BacklinkRef[];
  back: { to: DetailBackTo; label: string };
  header: ReactNode;
  tags: readonly string[];
  html: string;
}

const styles = stylex.create({
  back: {
    display: "inline-flex",
    alignItems: "center",
    gap: space.s1,
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s4,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s2,
    marginTop: space.s2,
    listStyle: "none",
    padding: 0,
  },
  tag: {
    display: "inline-block",
    paddingInline: space.s2,
    paddingBlock: space.s1,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
  },
  content: {
    color: colors.textPrimary,
  },
});

export function DetailShell({
  tree,
  treeKind,
  activeSlug,
  toc,
  backlinks,
  back,
  header,
  tags,
  html,
}: DetailShellProps) {
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={activeSlug} treeKind={treeKind} />,
    [tree, activeSlug, treeKind],
  );
  const rightSidebar = useMemo(
    () => <RightSidebar toc={toc} backlinks={backlinks} />,
    [toc, backlinks],
  );
  const contentHtml = useMemo(() => ({ __html: html }), [html]);

  return (
    <AppShell variant="detail" treeSidebar={treeSidebar} rightSidebar={rightSidebar}>
      <DetailLayout>
        <Link to={back.to} {...stylex.props(styles.back)}>
          ← {back.label}
        </Link>
        {header}
        {tags.length > 0 ? (
          <ul {...stylex.props(styles.tags)} role="list">
            {tags.map((tag) => (
              <li key={tag} {...stylex.props(styles.tag)}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        <div {...stylex.props(styles.content)} dangerouslySetInnerHTML={contentHtml} />
      </DetailLayout>
    </AppShell>
  );
}
