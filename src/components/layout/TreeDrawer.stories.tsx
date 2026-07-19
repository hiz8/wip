import type { Meta, StoryObj } from "@storybook/react-vite";
import { useCallback, useState } from "react";
import { TreeDrawer } from "./TreeDrawer.tsx";

const meta = {
  title: "layout/TreeDrawer",
  component: TreeDrawer,
  args: {
    // 各 Story は render で独自に開閉状態を持つため、ここでの値自体は使われない
    // (TreeDrawerProps が必須 props のみのため型を満たす目的で用意する)。
    isOpen: false,
    onOpenChange: () => {},
    children: null,
  },
} satisfies Meta<typeof TreeDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

function Demo() {
  const [open, setOpen] = useState(false);
  const openDrawer = useCallback(() => setOpen(true), []);
  return (
    <>
      <button type="button" onClick={openDrawer}>
        Open drawer
      </button>
      <TreeDrawer isOpen={open} onOpenChange={setOpen}>
        <nav aria-label="サンプルツリー">
          <ul>
            <li>フォルダ A</li>
            <li>フォルダ B</li>
            <li>ノート 1</li>
            <li>ノート 2</li>
          </ul>
        </nav>
      </TreeDrawer>
    </>
  );
}

/** ボタンで開閉。範囲外クリック / Esc で閉じる。 */
export const Default: Story = { render: () => <Demo /> };
