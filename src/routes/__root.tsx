import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
// Global stylesheets are imported from the root route (not router.tsx) so that
// tanstack-start's dev style collector includes them in the SSR <head>,
// avoiding a flash of unstyled content on the dev server's initial paint.
// (The @layer cascade order itself is locked separately by LAYER_ORDER_HTML
// below, which is what keeps StyleX winning regardless of injection order.)
import "@/styles/reset.css";
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
        content: "#fefefb",
      },
      {
        name: "theme-color",
        media: "(prefers-color-scheme: dark)",
        content: "#0e1014",
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

// In dev, @stylexjs/unplugin normally injects its virtual CSS link via Vite's
// transformIndexHtml hook. TanStack Start's SSR pipeline renders HTML in React
// instead of going through transformIndexHtml for link tags, so we add the
// link manually. In production the CSS is bundled into an asset and this link
// is unnecessary.
const STYLEX_DEV_CSS_HREF = "/virtual:stylex.css";

// Lock the CSS `@layer` cascade order up front, as the very first thing in
// <head>. @layer precedence is fixed by the order names first appear, so once
// these named layers are declared here, StyleX's later `@layer priorityN`
// declarations are always appended after them and therefore win — regardless
// of the order in which stylesheets are injected.
//
// This matters in dev: after hydration, TanStack removes its SSR style-collector
// <link> (which carried this same declaration) and Vite re-injects the global
// stylesheets as <style> tags *after* the StyleX virtual CSS link. Without this
// fixed declaration the order would invert (reset/base would override StyleX),
// which is exactly the dev-only regression this guards against. Mirrors the
// declaration at the top of src/styles/reset.css.
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
