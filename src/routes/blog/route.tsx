import { Outlet, createFileRoute } from "@tanstack/react-router";
import { getBlogTreeData } from "@/server/loaders.ts";
import { SITE_URL } from "@/lib/config/static.ts";

export const Route = createFileRoute("/blog")({
  loader: () => getBlogTreeData(),
  head: () => ({
    links: [
      {
        rel: "alternate",
        type: "application/atom+xml",
        href: `${SITE_URL}/blog/feed.xml`,
        title: "Blog feed",
      },
    ],
  }),
  component: BlogLayout,
});

function BlogLayout() {
  return <Outlet />;
}
