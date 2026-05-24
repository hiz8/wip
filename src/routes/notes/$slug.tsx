import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { DetailShell } from "@/components/layout/DetailShell.tsx";
import { getNoteDetailData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { SITE_DESCRIPTION } from "@/lib/config/static.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const BACK = { to: "/notes", label: "Notes" } as const;

const styles = stylex.create({
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
  const header = useMemo(
    () => (
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.title)}>{note.title}</h1>
        <p {...stylex.props(styles.meta)}>
          Created <time dateTime={note.created}>{note.created.slice(0, 10)}</time>
          {" · Updated "}
          <time dateTime={note.updated}>{note.updated.slice(0, 10)}</time>
        </p>
      </header>
    ),
    [note.title, note.created, note.updated],
  );

  return (
    <DetailShell
      tree={tree}
      treeKind="notes"
      activeSlug={note.slug}
      toc={note.toc}
      backlinks={note.incomingLinks}
      back={BACK}
      tags={note.tags}
      html={note.html}
      header={header}
      footnotes={note.footnotes}
      callouts={note.callouts}
    />
  );
}
