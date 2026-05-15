import * as stylex from "@stylexjs/stylex";
import { useMemo, useRef, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "./AppShell.tsx";
import { DetailLayout } from "./DetailLayout.tsx";
import { RightSidebar } from "./RightSidebar.tsx";
import { TreeSidebar } from "./TreeSidebar.tsx";
import { Marginalia } from "@/components/content/Marginalia.tsx";
import { FootnoteSection } from "@/components/content/FootnoteSection.tsx";
import type { TreeNode } from "@/lib/tree/buildTree.ts";
import type {
  BacklinkRef,
  CalloutEntry,
  ContentType,
  FootnoteEntry,
  TocEntry,
} from "@/types/content.ts";
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
  footnotes,
  callouts,
}: DetailShellProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const hasMarginaliaItems = footnotes.length > 0 || callouts.length > 0;

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
  const leftMargin = useMemo(
    () =>
      hasMarginaliaItems ? (
        <Marginalia side="left" contentRef={contentRef} footnotes={footnotes} callouts={callouts} />
      ) : null,
    [hasMarginaliaItems, footnotes, callouts],
  );
  const rightMargin = useMemo(
    () =>
      hasMarginaliaItems ? (
        <Marginalia
          side="right"
          contentRef={contentRef}
          footnotes={footnotes}
          callouts={callouts}
        />
      ) : null,
    [hasMarginaliaItems, footnotes, callouts],
  );
  const contentHtml = useMemo(() => ({ __html: html }), [html]);

  return (
    <AppShell variant="detail" treeSidebar={treeSidebar} rightSidebar={rightSidebar}>
      <DetailLayout leftMargin={leftMargin} rightMargin={rightMargin}>
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
        <div
          ref={contentRef}
          data-content-body
          {...stylex.props(styles.content)}
          dangerouslySetInnerHTML={contentHtml}
        />
        <FootnoteSection footnotes={footnotes} />
      </DetailLayout>
    </AppShell>
  );
}
