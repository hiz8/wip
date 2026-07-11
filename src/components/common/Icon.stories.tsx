import type { Meta, StoryObj } from "@storybook/react-vite";
import * as stylex from "@stylexjs/stylex";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { Icon, type IconType } from "./Icon.tsx";

const meta = {
  title: "common/Icon",
  component: Icon,
  args: {
    type: "home",
    size: 32,
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Controls で type / size / label を切り替えて単体確認する。 */
export const Playground: Story = {};

// IconType の全メンバー (Icon.tsx の union と同期)。型注釈により、union に
// 追加があってもここが網羅漏れでもコンパイルは通るため、追加時は手で追随する。
const ALL_TYPES: readonly IconType[] = [
  "home",
  "homeBold",
  "github",
  "global",
  "works",
  "worksBold",
  "blog",
  "blogBold",
  "notebook",
  "notebookBold",
  "notes",
  "notesBold",
  "book",
  "bookBold",
  "externalLink",
  "search",
  "sun",
  "moon",
];

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))",
    gap: space.s4,
  },
  cell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space.s2,
  },
  name: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },
});

/** 全アイコンの一覧。currentColor 着色のためテーマ切替の影響も確認できる。 */
export const Gallery: Story = {
  render: () => (
    <div {...stylex.props(styles.grid)}>
      {ALL_TYPES.map((type) => (
        <div key={type} {...stylex.props(styles.cell)}>
          <Icon type={type} size={32} />
          <code {...stylex.props(styles.name)}>{type}</code>
        </div>
      ))}
    </div>
  ),
};
