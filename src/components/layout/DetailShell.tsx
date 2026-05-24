import * as stylex from "@stylexjs/stylex";
import { useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "./AppShell.tsx";
import { DetailLayout } from "./DetailLayout.tsx";
import { RightSidebar } from "./RightSidebar.tsx";
import { TreeSidebar } from "./TreeSidebar.tsx";
import { FootnoteSection } from "@/components/content/FootnoteSection.tsx";
import { TagChips } from "@/components/common/TagChips.tsx";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import type {
  BacklinkRef,
  CalloutEntry,
  ContentType,
  FootnoteEntry,
  TocEntry,
} from "@/types/content.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

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
  footnotes: readonly FootnoteEntry[];
  callouts: readonly CalloutEntry[];
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
    marginTop: space.s2,
    marginBottom: space.s4,
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
  footnotes,
  callouts,
}: DetailShellProps) {
  // useMemo wrappers below keep JSX/object prop identities stable for the
  // project's react-perf lint rules (jsx-no-jsx-as-prop, jsx-no-new-object-as-prop).
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={activeSlug} treeKind={treeKind} />,
    [tree, activeSlug, treeKind],
  );
  const rightSidebar = useMemo(
    () => <RightSidebar toc={toc} backlinks={backlinks} />,
    [toc, backlinks],
  );
  const contentHtml = useMemo(() => ({ __html: html }), [html]);
  const hasMarginalia = callouts.length > 0 || footnotes.length > 0;

  return (
    <AppShell variant="detail" treeSidebar={treeSidebar} rightSidebar={rightSidebar}>
      <DetailLayout hasMarginalia={hasMarginalia}>
        <Link to={back.to} {...stylex.props(styles.back)}>
          ← {back.label}
        </Link>
        {header}
        {tags.length > 0 ? (
          <div {...stylex.props(styles.tags)}>
            <TagChips type={treeKind} tags={tags} />
          </div>
        ) : null}
        <div
          data-content-body
          data-pagefind-body
          {...stylex.props(styles.content)}
          dangerouslySetInnerHTML={contentHtml}
        />
        <FootnoteSection footnotes={footnotes} />
      </DetailLayout>
    </AppShell>
  );
}
