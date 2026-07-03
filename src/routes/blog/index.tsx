import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
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

// treeSidebar (タグツリー) は Task 10 で差し込む。それまでは AppShell のツリー列なしで表示する。
function BlogIndex() {
  const data = Route.useLoaderData();
  return (
    <AppShell variant="list">
      <BlogListPage data={data} />
    </AppShell>
  );
}
