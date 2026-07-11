import type { Decorator, Preview } from "@storybook/react-vite";
import * as stylex from "@stylexjs/stylex";
import {
  RouterContextProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
// グローバルスタイルシートは src/routes/__root.tsx と同じ順序で import する。
import "@/styles/reset.css";
import "@/styles/brand-vars.css";
import "@/styles/callout-vars.css";
import "@/styles/code-vars.css";
import "@/styles/font-vars.css";
import "@/styles/prose-vars.css";
import "@/styles/content.css";
import { themeClasses } from "@/styles/theme.stylex.ts";
import { colors } from "@/styles/tokens.stylex.ts";

// dev の @stylexjs/unplugin は StyleX の CSS を /virtual:stylex.css で配信するが、
// Storybook の iframe.html には transformIndexHtml 経由の link 注入が届かないため
// 手動で追加する (__root.tsx の STYLEX_DEV_CSS_HREF と同じ回避策)。
// 本番 build では CSS がバンドルされるため不要。
const STYLEX_DEV_CSS_HREF = "/virtual:stylex.css";
if (
  import.meta.env.DEV &&
  document.head.querySelector(`link[href="${STYLEX_DEV_CSS_HREF}"]`) === null
) {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = STYLEX_DEV_CSS_HREF;
  document.head.append(link);
}

const styles = stylex.create({
  // Storybook の canvas (iframe の body) をサイト本体の配色に合わせる。
  body: {
    backgroundColor: colors.bgBase,
    color: colors.textPrimary,
  },
});

// iframe の body は React ツリー外のため className を直接適用する。
const bodyClassName = stylex.props(styles.body).className ?? "";
for (const token of bodyClassName.split(/\s+/u)) {
  if (token) document.body.classList.add(token);
}

type Resolved = "light" | "dark";

function splitClasses(className: string): string[] {
  return className.split(/\s+/u).filter(Boolean);
}

// src/lib/theme/useTheme.ts の applyPreference と同じ操作を localStorage 抜きで行う。
// テーマは常に明示 (light / dark) 指定にし、defineVars の prefers-color-scheme
// フォールバックで閲覧者の OS 設定が混ざらないようにする。
function applyStoryTheme(resolved: Resolved): void {
  const root = document.documentElement;
  const lightTokens = splitClasses(themeClasses.light);
  const darkTokens = splitClasses(themeClasses.dark);
  for (const token of lightTokens) root.classList.remove(token);
  for (const token of darkTokens) root.classList.remove(token);
  const tokens = resolved === "dark" ? darkTokens : lightTokens;
  for (const token of tokens) root.classList.add(token);
  root.dataset["theme"] = resolved;
  root.dataset["themeResolved"] = resolved;
  root.style.colorScheme = resolved;
}

// documentElement への適用は React ツリー外の冪等な操作なので、hook を使わず
// decorator 本体で同期的に行う (ツールバー変更ごとに再実行される)。
const withTheme: Decorator = (Story, context) => {
  applyStoryTheme(context.globals["theme"] === "dark" ? "dark" : "light");
  return <Story />;
};

// Link を使うコンポーネントを描画できるよう、最小のルートツリーを持つ router の
// コンテキストだけを提供する。ストーリーが参照する実ルート (/notes/$slug など) は
// 登録しないため、href は to + params の補間結果になりナビゲーションはしない。
const storyRouter = createRouter({
  routeTree: createRootRoute(),
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

const withRouter: Decorator = (Story) => (
  <RouterContextProvider router={storyRouter}>
    <Story />
  </RouterContextProvider>
);

const preview: Preview = {
  decorators: [withRouter, withTheme],
  globalTypes: {
    theme: {
      description: "サイトのカラーテーマ",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", icon: "sun", title: "Light" },
          { value: "dark", icon: "moon", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
};

export default preview;
