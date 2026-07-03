import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
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

// treeSidebar (タグツリー) は Task 10 で差し込む。それまでは AppShell のツリー列なしで表示する。
function BlogPageN() {
  const data = Route.useLoaderData();
  return (
    <AppShell variant="list">
      <BlogListPage data={data} />
    </AppShell>
  );
}
