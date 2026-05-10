import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { DetailLayout } from "@/components/layout/DetailLayout.tsx";
import { RightSidebar } from "@/components/layout/RightSidebar.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { GlossaryHeader } from "@/components/content/GlossaryHeader.tsx";
import { getGlossaryDetailData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { SITE_DESCRIPTION } from "@/lib/config/static.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

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

export const Route = createFileRoute("/glossary/$slug")({
  loader: async ({ params }) => {
    const term = await getGlossaryDetailData({ data: { slug: params.slug } });
    if (!term) {
      throw notFound();
    }
    return term;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: makeTitle(loaderData?.term ?? null) },
      {
        name: "description",
        content: loaderData?.summary ?? SITE_DESCRIPTION,
      },
    ],
  }),
  component: GlossaryDetail,
});

function GlossaryDetail() {
  const term = Route.useLoaderData();
  const tree = useLoaderData({ from: "/glossary" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={term.slug} treeKind="glossary" />,
    [tree, term.slug],
  );
  const rightSidebar = useMemo(
    () => <RightSidebar toc={term.toc} backlinks={term.incomingLinks} />,
    [term.toc, term.incomingLinks],
  );
  const contentHtml = useMemo(() => ({ __html: term.html }), [term.html]);

  return (
    <AppShell variant="detail" treeSidebar={treeSidebar} rightSidebar={rightSidebar}>
      <DetailLayout>
        <Link to="/glossary" {...stylex.props(styles.back)}>
          ← Glossary
        </Link>
        <GlossaryHeader term={term.term} furigana={term.furigana} aliases={term.aliases} />
        {term.tags.length > 0 && (
          <ul {...stylex.props(styles.tags)} role="list">
            {term.tags.map((tag) => (
              <li key={tag} {...stylex.props(styles.tag)}>
                {tag}
              </li>
            ))}
          </ul>
        )}
        <div {...stylex.props(styles.content)} dangerouslySetInnerHTML={contentHtml} />
      </DetailLayout>
    </AppShell>
  );
}
