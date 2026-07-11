import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import stylex from "@stylexjs/unplugin";
import { createStylexPluginOptions } from "../vite/stylex-plugin-options.ts";

// Storybook 専用の Vite 設定。コンポーネント描画に必要な alias / StyleX / React
// だけを載せる (アプリ本体の設定は .storybook/main.ts のコメントを参照)。
export default defineConfig({
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/../src`,
    },
  },
  plugins: [
    // oxlint-disable-next-line import/no-named-as-default-member -- 型情報は default にしか含まれていないため
    stylex.vite(createStylexPluginOptions()),
    viteReact(),
  ],
});
