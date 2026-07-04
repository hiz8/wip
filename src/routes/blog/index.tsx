import { useMemo } from "react";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { getBlogIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const data = await getBlogIndexData({ data: { page: 1 } });
    if (data === null) throw notFound();
    return data;
  },
  head: () => ({
    meta: [
      { title: makeTitle("Blog") },
      { name: "description", content: "タグの組み合わせで回遊するブログ。" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const data = Route.useLoaderData();
  const tree = useLoaderData({ from: "/blog" });
  const treeSidebar = useMemo(
    () => <BlogTagTreeSidebar tree={tree} currentTagset={null} />,
    [tree],
  );
  return (
    <AppShell variant="list" treeSidebar={treeSidebar}>
      <BlogListPage data={data} />
    </AppShell>
  );
}
