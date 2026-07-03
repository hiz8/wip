import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
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

// treeSidebar (タグツリー) は Task 10 で差し込む。それまでは AppShell のツリー列なしで表示する。
function BlogTagsetPage() {
  const data = Route.useLoaderData();
  return (
    <AppShell variant="list">
      <BlogListPage data={data} />
    </AppShell>
  );
}
