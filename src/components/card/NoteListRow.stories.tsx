import type { Meta, StoryObj } from "@storybook/react-vite";
import * as stylex from "@stylexjs/stylex";
import { NoteListRow } from "./NoteListRow.tsx";

const meta = {
  title: "card/NoteListRow",
  component: NoteListRow,
  args: {
    slug: "react-server-components",
    title: "React Server Components の理解",
    folder: "Frontend",
    updated: "2026-06-28T10:00:00+09:00",
    showDivider: false,
  },
} satisfies Meta<typeof NoteListRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutFolder: Story = {
  args: {
    folder: null,
    title: "Vault 直下のノート",
  },
};

const styles = stylex.create({
  list: {
    maxWidth: "48rem",
  },
});

const ROWS = [
  {
    slug: "react-server-components",
    title: "React Server Components の理解",
    folder: "Frontend",
    updated: "2026-06-28T10:00:00+09:00",
  },
  {
    slug: "stylex-theming",
    title: "StyleX のテーマ設計パターン",
    folder: "Frontend",
    updated: "2026-05-14T21:30:00+09:00",
  },
  {
    slug: "obsidian-vault-structure",
    title: "Obsidian Vault の構成メモ — 長いタイトルの折り返しを確認するための例",
    folder: "PKM",
    updated: "2026-01-03T08:15:00+09:00",
  },
] as const;

/** 一覧での見え方 (先頭行のみ罫線なし)。ビューポートを縮めると 720px 以下で列が減る。 */
export const List: Story = {
  render: () => (
    <div {...stylex.props(styles.list)}>
      {ROWS.map((row, index) => (
        <NoteListRow
          key={row.slug}
          slug={row.slug}
          title={row.title}
          folder={row.folder}
          updated={row.updated}
          showDivider={index > 0}
        />
      ))}
    </div>
  ),
};
