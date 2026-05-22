import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { TagIndexList } from "@/components/common/TagIndexList.tsx";
import { getGlossaryTagsData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

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
  heading: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.weightSemibold,
    marginBottom: space.s5,
  },
  empty: {
    color: colors.textMuted,
  },
});

export const Route = createFileRoute("/glossary/tags/")({
  loader: () => getGlossaryTagsData(),
  head: () => ({
    meta: [
      { title: makeTitle("Glossary Tags") },
      { name: "description", content: "Tags used across published Glossary terms." },
    ],
  }),
  component: GlossaryTagsIndex,
});

function GlossaryTagsIndex() {
  const tags = Route.useLoaderData();
  const tree = useLoaderData({ from: "/glossary" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="glossary" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <Link to="/glossary" {...stylex.props(styles.back)}>
        ← Glossary
      </Link>
      <h1 {...stylex.props(styles.heading)}>Glossary Tags</h1>
      {tags.length === 0 ? (
        <p {...stylex.props(styles.empty)}>No tags yet.</p>
      ) : (
        <TagIndexList type="glossary" tags={tags} />
      )}
    </AppShell>
  );
}
