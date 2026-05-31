import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
// グローバルスタイルシートは router.tsx ではなく root route から import する。
// こうすることで tanstack-start の dev style collector がそれらを SSR の <head>
// に含め、dev サーバーの初回描画でスタイル未適用のちらつきが起きるのを防ぐ。
// (@layer のカスケード順序自体は下の LAYER_ORDER_HTML で別途固定しており、
// それが injection 順に関係なく StyleX を勝たせ続ける根拠となる。)
import "@/styles/reset.css";
import "@/styles/brand-vars.css";
import "@/styles/callout-vars.css";
import "@/styles/code-vars.css";
import "@/styles/font-vars.css";
import "@/styles/prose-vars.css";
import "@/styles/content.css";
import { themeScript } from "@/lib/theme/themeScript.ts";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
} from "@/lib/config/static.ts";

const THEME_SCRIPT_HTML = { __html: themeScript };

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: SITE_NAME },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: SITE_OG_IMAGE },
      { property: "og:locale", content: SITE_LOCALE.replace("-", "_") },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: light)",
        content: "#FBFCFE",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#1B2030",
      },
    ],
    links: [
      {
        rel: "alternate",
        type: "application/atom+xml",
        title: SITE_NAME,
        href: `${SITE_URL}/feed.xml`,
      },
      { rel: "sitemap", type: "application/xml", href: `${SITE_URL}/sitemap.xml` },
    ],
  }),
  component: RootDocument,
});

// dev では @stylexjs/unplugin は通常 Vite の transformIndexHtml hook 経由で
// virtual CSS の link を inject する。TanStack Start の SSR パイプラインは
// link タグについて transformIndexHtml を通さず React で HTML をレンダリングする
// ため、ここで link を手動追加する。本番では CSS が asset にバンドルされるため
// この link は不要。
const STYLEX_DEV_CSS_HREF = "/virtual:stylex.css";

// CSS の `@layer` カスケード順序を、<head> の最初の要素として前もって固定する。
// @layer の優先順位は名前が最初に現れる順序で決まるため、ここで名前付きレイヤーを
// 宣言しておけば、StyleX が後から出す `@layer priorityN` 宣言は常にそれらの後に
// 追加され、結果として勝つ — スタイルシートの injection 順序に関係なく。
//
// これは dev で重要になる: hydration 後、TanStack は (同じ宣言を持っていた) SSR の
// style-collector <link> を取り除き、Vite はグローバルスタイルシートを StyleX の
// virtual CSS link の *後* に <style> タグとして再 inject する。この固定宣言が
// なければ順序が反転し (reset/base が StyleX を上書きしてしまう)、これはまさに
// この宣言が防いでいる dev 限定のリグレッションである。src/styles/reset.css
// 冒頭の宣言をミラーしている。
const LAYER_ORDER_HTML = { __html: "@layer reset, base, components, utilities;" };

function RootDocument() {
  return (
    <html lang={SITE_LOCALE} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={LAYER_ORDER_HTML} />
        <script dangerouslySetInnerHTML={THEME_SCRIPT_HTML} />
        {import.meta.env.DEV ? <link rel="stylesheet" href={STYLEX_DEV_CSS_HREF} /> : null}
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
