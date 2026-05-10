import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { DetailLayout } from "@/components/layout/DetailLayout.tsx";
import { RightSidebar } from "@/components/layout/RightSidebar.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { getNoteDetailData } from "@/server/loaders.ts";
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
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
    marginBottom: space.s5,
    paddingBottom: space.s4,
    borderBlockEndWidth: 1,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: colors.borderSubtle,
  },
  title: {
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightBold,
    lineHeight: typography.lineHeightTight,
    color: colors.textPrimary,
  },
  meta: {
    color: colors.textMuted,
    fontSize: typography.fontSizeSm,
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

export const Route = createFileRoute("/notes/$slug")({
  loader: async ({ params }) => {
    const note = await getNoteDetailData({ data: { slug: params.slug } });
    if (!note) {
      throw notFound();
    }
    return note;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: makeTitle(loaderData?.title ?? null) },
      {
        name: "description",
        content: loaderData?.summary ?? SITE_DESCRIPTION,
      },
    ],
  }),
  component: NoteDetail,
});

function NoteDetail() {
  const note = Route.useLoaderData();
  const tree = useLoaderData({ from: "/notes" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={note.slug} treeKind="notes" />,
    [tree, note.slug],
  );
  const rightSidebar = useMemo(
    () => <RightSidebar toc={note.toc} backlinks={note.incomingLinks} />,
    [note.toc, note.incomingLinks],
  );
  const contentHtml = useMemo(() => ({ __html: note.html }), [note.html]);

  return (
    <AppShell variant="detail" treeSidebar={treeSidebar} rightSidebar={rightSidebar}>
      <DetailLayout>
        <Link to="/notes" {...stylex.props(styles.back)}>
          ← Notes
        </Link>
        <header {...stylex.props(styles.header)}>
          <h1 {...stylex.props(styles.title)}>{note.title}</h1>
          <p {...stylex.props(styles.meta)}>
            Created <time dateTime={note.created}>{note.created.slice(0, 10)}</time>
            {" · Updated "}
            <time dateTime={note.updated}>{note.updated.slice(0, 10)}</time>
          </p>
          {note.tags.length > 0 && (
            <ul {...stylex.props(styles.tags)} role="list">
              {note.tags.map((tag) => (
                <li key={tag} {...stylex.props(styles.tag)}>
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>
        <div {...stylex.props(styles.content)} dangerouslySetInnerHTML={contentHtml} />
      </DetailLayout>
    </AppShell>
  );
}
