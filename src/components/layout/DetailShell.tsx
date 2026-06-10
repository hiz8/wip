import * as stylex from "@stylexjs/stylex";
import { useMemo, type ReactNode } from "react";
import { AppShell } from "./AppShell.tsx";
import { DetailLayout } from "./DetailLayout.tsx";
import { RightSidebar } from "./RightSidebar.tsx";
import { TreeSidebar } from "./TreeSidebar.tsx";
import { FootnoteSection } from "@/components/content/FootnoteSection.tsx";
import { Breadcrumb } from "@/components/common/Breadcrumb.tsx";
import { TagChips } from "@/components/common/TagChips.tsx";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import type {
  BacklinkRef,
  CalloutEntry,
  ContentType,
  FootnoteEntry,
  TocEntry,
} from "@/types/content.ts";
import { colors, space } from "@/styles/tokens.stylex.ts";

type DetailCrumbTo = "/notes" | "/glossary" | "/books";

/** 詳細ページのパンくず。to はカテゴリトップへ戻るリンクになる。 */
export interface DetailCrumb {
  to: DetailCrumbTo;
  label: string;
  /** 中間セグメント (Notes のフォルダ名、Glossary のかな行など)。null は省略。 */
  middle?: string | null;
  current: string;
}

interface DetailShellProps {
  tree: readonly TreeNode[];
  treeKind: ContentType;
  activeSlug: string;
  toc: readonly TocEntry[];
  backlinks: readonly BacklinkRef[];
  crumb: DetailCrumb;
  header: ReactNode;
  tags: readonly string[];
  html: string;
  footnotes: readonly FootnoteEntry[];
  callouts: readonly CalloutEntry[];
}

const styles = stylex.create({
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
  crumb,
  header,
  tags,
  html,
  footnotes,
  callouts,
}: DetailShellProps) {
  // 下の useMemo ラッパーは、プロジェクトの react-perf lint ルール
  // (jsx-no-jsx-as-prop, jsx-no-new-object-as-prop) を満たすため、JSX/オブジェクト
  // の prop identity を安定させる。
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={activeSlug} treeKind={treeKind} />,
    [tree, activeSlug, treeKind],
  );
  const rightSidebar = useMemo(
    () => <RightSidebar toc={toc} backlinks={backlinks} />,
    [toc, backlinks],
  );
  const contentHtml = useMemo(() => ({ __html: html }), [html]);
  const crumbRoot = useMemo(() => ({ label: crumb.label, to: crumb.to }), [crumb.label, crumb.to]);
  const hasMarginalia = callouts.length > 0 || footnotes.length > 0;

  return (
    <AppShell variant="detail" treeSidebar={treeSidebar} rightSidebar={rightSidebar}>
      <DetailLayout hasMarginalia={hasMarginalia}>
        <Breadcrumb root={crumbRoot} middle={crumb.middle} current={crumb.current} />
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
