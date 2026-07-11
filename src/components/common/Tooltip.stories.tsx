import type { Meta, StoryObj } from "@storybook/react-vite";
import * as stylex from "@stylexjs/stylex";
import { colors, radius, space } from "@/styles/tokens.stylex.ts";
import { Icon } from "./Icon.tsx";
import { Tooltip } from "./Tooltip.tsx";

const styles = stylex.create({
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: space.s2,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    color: colors.textPrimary,
    cursor: "pointer",
  },
});

// react-aria-components の overlay (TooltipTrigger) を使うコンポーネントの手本。
// children は単一の focusable 要素である必要がある (Tooltip.tsx 参照)。
const trigger = (
  <button type="button" aria-label="検索" {...stylex.props(styles.trigger)}>
    <Icon type="search" size={20} />
  </button>
);

const meta = {
  title: "common/Tooltip",
  component: Tooltip,
  args: {
    label: "検索 (Ctrl+K)",
    children: trigger,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/** トリガーへのホバーまたはキーボードフォーカスで表示される。 */
export const Default: Story = {};
