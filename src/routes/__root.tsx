import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
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

function RootDocument() {
  return (
    <html lang={SITE_LOCALE} suppressHydrationWarning>
      <head>
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
