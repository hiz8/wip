import { defineMain } from "@storybook/react-vite/node";

export default defineMain({
  stories: ["../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        // アプリ本体の vite.config.ts は tanstackStart() (SSG プリレンダー・
        // サーバー機能) を含み Storybook の dev サーバーと干渉するため、
        // 自動マージさせず Storybook 専用の Vite 設定を明示する。
        viteConfigPath: ".storybook/vite.config.ts",
      },
    },
  },
});
