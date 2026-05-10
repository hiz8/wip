import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { themeScript } from "@/lib/theme/themeScript.ts";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
} from "@/lib/config/static.ts";

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
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang={SITE_LOCALE}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
