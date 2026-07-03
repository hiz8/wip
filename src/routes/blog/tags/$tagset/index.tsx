import { useMemo } from "react";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { getBlogTagsetData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

export const Route = createFileRoute("/blog/tags/$tagset/")({
  loader: async ({ params }) => {
    const data = await getBlogTagsetData({ data: { tagset: params.tagset, page: 1 } });
    if (data === null) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: makeTitle(loaderData?.pageTitle ?? "Blog") }],
  }),
  component: BlogTagsetPage,
});

function BlogTagsetPage() {
  const data = Route.useLoaderData();
  const tree = useLoaderData({ from: "/blog" });
  const treeSidebar = useMemo(
    () => <BlogTagTreeSidebar tree={tree} currentTagset={data.tagset} />,
    [tree, data.tagset],
  );
  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <BlogListPage data={data} />
    </AppShell>
  );
}
