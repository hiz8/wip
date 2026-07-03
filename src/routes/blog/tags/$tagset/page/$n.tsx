import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { parsePageParam } from "@/lib/blog/pages.ts";
import { getBlogTagsetData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

export const Route = createFileRoute("/blog/tags/$tagset/page/$n")({
  loader: async ({ params }) => {
    const page = parsePageParam(params.n);
    if (page === null) throw notFound();
    const data = await getBlogTagsetData({ data: { tagset: params.tagset, page } });
    if (data === null) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [{ title: makeTitle(`${loaderData?.pageTitle ?? "Blog"} — page ${params.n}`) }],
  }),
  component: BlogTagsetPageN,
});

// treeSidebar (タグツリー) は Task 10 で差し込む。それまでは AppShell のツリー列なしで表示する。
function BlogTagsetPageN() {
  const data = Route.useLoaderData();
  return (
    <AppShell variant="list">
      <BlogListPage data={data} />
    </AppShell>
  );
}
