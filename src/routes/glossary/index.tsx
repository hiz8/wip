import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { GlossaryListRow } from "@/components/card/GlossaryListRow.tsx";
import { IndexPageHeader } from "@/components/common/IndexPageHeader.tsx";
import { FURIGANA_GROUP_ORDER, furiganaGroupLabel } from "@/lib/glossary/groupByFurigana.ts";
import { getGlossaryIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  wrap: {
    maxWidth: "45rem",
  },
  // 五十音索引。エントリの有無を塗りで示すボタン列。
  kanaNav: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s1,
    marginBottom: space.s6,
    paddingBottom: space.s4,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderSubtle,
  },
  kanaCell: {
    display: "grid",
    placeItems: "center",
    minWidth: "2rem",
    height: "2rem",
    paddingInline: space.s2,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: "solid",
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeSm,
  },
  kanaActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
    color: colors.bgSurface,
    textDecoration: "none",
  },
  kanaInactive: {
    borderColor: colors.borderSubtle,
    color: colors.textMuted,
  },
  groupSection: {
    marginBottom: space.s6,
  },
  groupHeading: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSize2xl,
    fontWeight: typography.weightMedium,
    color: colors.accent,
    paddingBottom: space.s2,
    marginBottom: space.s3,
    borderBottomWidth: 2,
    borderBottomStyle: "solid",
    borderBottomColor: colors.accent,
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
  const activeGroups = useMemo(() => new Set(sections.map((s) => s.name)), [sections]);

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <div {...stylex.props(styles.wrap)}>
        <IndexPageHeader
          crumbRoot="Glossary"
          crumbCurrent="索引"
          title="単語帳"
          sub="Web 開発で「毎回ググっている」用語を、自分の言葉で定義し直したもの。Notes より粒度が細かく、Books からも参照される。"
          tagsTo="/glossary/tags"
        />

        {sections.length === 0 ? (
          <p {...stylex.props(styles.empty)}>No published terms yet.</p>
        ) : (
          <>
            <nav {...stylex.props(styles.kanaNav)} aria-label="五十音索引">
              {FURIGANA_GROUP_ORDER.map((name) =>
                activeGroups.has(name) ? (
                  <a
                    key={name}
                    href={`#group-${encodeURIComponent(name)}`}
                    {...stylex.props(styles.kanaCell, styles.kanaActive)}
                  >
                    {furiganaGroupLabel(name)}
                  </a>
                ) : (
                  <span key={name} {...stylex.props(styles.kanaCell, styles.kanaInactive)}>
                    {furiganaGroupLabel(name)}
                  </span>
                ),
              )}
            </nav>

            {sections.map((section) => (
              <section
                key={section.name}
                id={`group-${encodeURIComponent(section.name)}`}
                {...stylex.props(styles.groupSection)}
              >
                <h2 {...stylex.props(styles.groupHeading)}>{furiganaGroupLabel(section.name)}</h2>
                {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示 */}
                <ul {...stylex.props(styles.list)} role="list">
                  {section.items.map((item, index) => (
                    <li key={item.slug}>
                      <GlossaryListRow
                        slug={item.slug}
                        term={item.term}
                        furigana={item.furigana}
                        summary={item.summary}
                        showDivider={index > 0}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </>
        )}
      </div>
    </AppShell>
  );
}
