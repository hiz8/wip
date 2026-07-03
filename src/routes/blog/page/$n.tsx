import { useMemo } from "react";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { parsePageParam } from "@/lib/blog/pages.ts";
import { getBlogIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

export const Route = createFileRoute("/blog/page/$n")({
  loader: async ({ params }) => {
    const page = parsePageParam(params.n);
    if (page === null) throw notFound();
    const data = await getBlogIndexData({ data: { page } });
    if (data === null) throw notFound();
    return data;
  },
  head: ({ params }) => ({ meta: [{ title: makeTitle(`Blog — page ${params.n}`) }] }),
  component: BlogPageN,
});

function BlogPageN() {
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
