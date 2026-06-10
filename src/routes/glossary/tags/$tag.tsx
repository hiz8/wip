import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { GlossaryListRow } from "@/components/card/GlossaryListRow.tsx";
import { getGlossaryByTagData } from "@/server/loaders.ts";
import { decodeTagSlug } from "@/lib/tags/index.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  wrap: {
    maxWidth: "45rem",
  },
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
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  empty: {
    color: colors.textMuted,
  },
});

export const Route = createFileRoute("/glossary/tags/$tag")({
  loader: ({ params }) => getGlossaryByTagData({ data: { tag: params.tag } }),
  head: ({ params }) => {
    const tag = decodeTagSlug(params.tag);
    return {
      meta: [
        { title: makeTitle(`Glossary tagged "${tag}"`) },
        { name: "description", content: `Glossary terms tagged with "${tag}".` },
      ],
    };
  },
  component: GlossaryByTag,
});

function GlossaryByTag() {
  const terms = Route.useLoaderData();
  const { tag } = Route.useParams();
  const decodedTag = decodeTagSlug(tag);
  const tree = useLoaderData({ from: "/glossary" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="glossary" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <div {...stylex.props(styles.wrap)}>
        <Link to="/glossary/tags" {...stylex.props(styles.back)}>
          ← Glossary Tags
        </Link>
        <h1 {...stylex.props(styles.heading)}>#{decodedTag}</h1>
        {terms.length === 0 ? (
          <p {...stylex.props(styles.empty)}>No terms with this tag.</p>
        ) : (
          // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示
          <ul {...stylex.props(styles.list)} role="list">
            {terms.map((term, index) => (
              <li key={term.slug}>
                <GlossaryListRow
                  slug={term.slug}
                  term={term.term}
                  furigana={term.furigana}
                  summary={term.summary}
                  showDivider={index > 0}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
