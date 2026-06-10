import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { NoteListRow } from "@/components/card/NoteListRow.tsx";
import { getNotesIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  wrap: {
    maxWidth: "46em",
  },
  crumb: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginBottom: space.s5,
  },
  crumbSep: {
    opacity: 0.5,
  },
  crumbCurrent: {
    color: colors.textPrimary,
  },
  heading: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    letterSpacing: "-0.01em",
    marginBottom: space.s3,
  },
  sub: {
    fontFamily: typography.fontBrand,
    fontStyle: "italic",
    fontSize: typography.fontSizeMd,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
    maxWidth: "32em",
    marginBottom: space.s4,
  },
  tagsLink: {
    display: "inline-block",
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s4,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
});

export const Route = createFileRoute("/notes/")({
  loader: () => getNotesIndexData(),
  head: () => ({
    meta: [
      { title: makeTitle("Notes") },
      { name: "description", content: "Notes — published entries from the Vault." },
    ],
  }),
  component: NotesIndex,
});

function NotesIndex() {
  const notes = Route.useLoaderData();
  const tree = useLoaderData({ from: "/notes" });
  const treeSidebar = useMemo(
    () => <TreeSidebar tree={tree} activeSlug={null} treeKind="notes" />,
    [tree],
  );

  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <p {...stylex.props(styles.crumb)}>
        <span>Notes</span>
        <span {...stylex.props(styles.crumbSep)} aria-hidden="true">
          /
        </span>
        <span {...stylex.props(styles.crumbCurrent)}>最近の更新</span>
      </p>

      <div {...stylex.props(styles.wrap)}>
        <h1 {...stylex.props(styles.heading)}>Notes</h1>
        <p {...stylex.props(styles.sub)}>
          学んだことを書き留めた育成中のノート。更新の新しい順に並んでいる。
        </p>
        <Link to="/notes/tags" {...stylex.props(styles.tagsLink)}>
          Browse tags →
        </Link>

        {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示 */}
        <ul {...stylex.props(styles.list)} role="list">
          {notes.map((note, index) => (
            <li key={note.slug}>
              <NoteListRow
                slug={note.slug}
                title={note.title}
                folder={note.folder}
                updated={note.updated}
                showDivider={index > 0}
              />
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
