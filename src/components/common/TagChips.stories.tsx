import type { Meta, StoryObj } from "@storybook/react-vite";
import { TagChips } from "./TagChips.tsx";

// TanStack Router の Link を使うコンポーネントの手本。.storybook/preview.tsx の
// router decorator がコンテキストを提供するため、ストーリー側の追加設定は不要。
const meta = {
  title: "common/TagChips",
  component: TagChips,
  args: {
    type: "notes",
    tags: ["react", "frontend/react", "typescript"],
  },
} satisfies Meta<typeof TagChips>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Notes: Story = {};

/** 階層タグは URL 上 `/` が `--` にエスケープされる (href で確認できる)。 */
export const HierarchicalTags: Story = {
  args: {
    tags: ["frontend/react", "frontend/css", "backend/node"],
  },
};

export const ManyTags: Story = {
  args: {
    tags: [
      "react",
      "typescript",
      "stylex",
      "react-aria-components",
      "tanstack-start",
      "obsidian",
      "digital-garden",
      "cloudflare-workers",
      "vite",
      "vitest",
    ],
  },
};
