import { useMemo } from "react";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { DetailShell } from "@/components/layout/DetailShell.tsx";
import type { DetailCrumb } from "@/components/layout/DetailShell.tsx";
import { GlossaryHeader } from "@/components/content/GlossaryHeader.tsx";
import { furiganaGroupLabel, groupByFurigana } from "@/lib/glossary/groupByFurigana.ts";
import { getGlossaryDetailData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { SITE_DESCRIPTION } from "@/lib/config/static.ts";

export const Route = createFileRoute("/glossary/$slug")({
  loader: async ({ params }) => {
    const term = await getGlossaryDetailData({ data: { slug: params.slug } });
    if (!term) {
      throw notFound();
    }
    return term;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: makeTitle(loaderData?.term ?? null) },
      {
        name: "description",
        content: loaderData?.summary ?? SITE_DESCRIPTION,
      },
    ],
  }),
  component: GlossaryDetail,
});

function GlossaryDetail() {
  const term = Route.useLoaderData();
  const tree = useLoaderData({ from: "/glossary" });
  const header = useMemo(
    () => <GlossaryHeader term={term.term} furigana={term.furigana} aliases={term.aliases} />,
    [term.term, term.furigana, term.aliases],
  );
  const crumb = useMemo<DetailCrumb>(
    () => ({
      to: "/glossary",
      label: "Glossary",
      middle: furiganaGroupLabel(groupByFurigana(term.furigana)),
      current: term.term,
    }),
    [term.furigana, term.term],
  );

  return (
    <DetailShell
      tree={tree}
      treeKind="glossary"
      activeSlug={term.slug}
      toc={term.toc}
      backlinks={term.incomingLinks}
      crumb={crumb}
      tags={term.tags}
      html={term.html}
      header={header}
      footnotes={term.footnotes}
      callouts={term.callouts}
    />
  );
}
