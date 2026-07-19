import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeSidebar } from "@/components/layout/TreeSidebar.tsx";
import { NoteListRow } from "@/components/card/NoteListRow.tsx";
import { IndexPageHeader } from "@/components/common/IndexPageHeader.tsx";
import { getNotesIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

const styles = stylex.create({
  wrap: {
    maxWidth: "46em",
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
      <div {...stylex.props(styles.wrap)}>
        <IndexPageHeader
          crumbRoot="Notes"
          crumbCurrent="最近の更新"
          title="Notes"
          sub="タスクなどに取り組む際に参照する情報や考えをまとめたノート。原則、意図的に書きかけの状態となっている。"
          tagsTo="/notes/tags"
        />

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
