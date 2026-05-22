import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { GlossaryItem } from "@/components/card/GlossaryItem.tsx";
import { getGlossaryIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  heading: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.weightSemibold,
    marginBottom: space.s3,
  },
  tagsLink: {
    display: "inline-block",
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s5,
  },
  jumpNav: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s2,
    listStyle: "none",
    margin: 0,
    marginBottom: space.s5,
    padding: 0,
  },
  jumpItem: {
    display: "inline-block",
  },
  jumpLink: {
    display: "inline-block",
    paddingInline: space.s3,
    paddingBlock: space.s1,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
  },
  groupSection: {
    marginBottom: space.s6,
  },
  groupHeading: {
    fontSize: typography.fontSizeLg,
    fontWeight: typography.weightSemibold,
    marginBottom: space.s3,
    color: colors.textPrimary,
  },
  list: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: space.s4,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  empty: {
    color: colors.textMuted,
  },
});

export const Route = createFileRoute("/glossary/")({
  loader: () => getGlossaryIndexData(),
  head: () => ({
    meta: [
      { title: makeTitle("Glossary") },
      {
        name: "description",
        content: "Glossary — published terms grouped by 五十音 furigana index.",
      },
    ],
  }),
  component: GlossaryIndex,
});

function GlossaryIndex() {
  const sections = Route.useLoaderData();
  const tree = useLoaderData({ from: "/glossary" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="glossary" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <h1 {...stylex.props(styles.heading)}>Glossary</h1>
      <Link to="/glossary/tags" {...stylex.props(styles.tagsLink)}>
        Browse tags →
      </Link>
      {sections.length === 0 ? (
        <p {...stylex.props(styles.empty)}>No published terms yet.</p>
      ) : (
        <>
          <ul {...stylex.props(styles.jumpNav)} role="list" aria-label="Jump to section">
            {sections.map((section) => (
              <li key={section.name} {...stylex.props(styles.jumpItem)}>
                <a
                  href={`#group-${encodeURIComponent(section.name)}`}
                  {...stylex.props(styles.jumpLink)}
                >
                  {section.name}
                </a>
              </li>
            ))}
          </ul>
          {sections.map((section) => (
            <section
              key={section.name}
              id={`group-${encodeURIComponent(section.name)}`}
              {...stylex.props(styles.groupSection)}
            >
              <h2 {...stylex.props(styles.groupHeading)}>{section.name}</h2>
              <ul {...stylex.props(styles.list)} role="list">
                {section.items.map((item) => (
                  <li key={item.slug}>
                    <GlossaryItem
                      slug={item.slug}
                      term={item.term}
                      furigana={item.furigana}
                      summary={item.summary}
                      aliases={item.aliases}
                      tags={item.tags}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </AppShell>
  );
}
