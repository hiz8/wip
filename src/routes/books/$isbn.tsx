import { useMemo } from "react";
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { DetailShell } from "@/components/layout/DetailShell.tsx";
import { BookHeader } from "@/components/content/BookHeader.tsx";
import { getBookDetailData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { SITE_DESCRIPTION } from "@/lib/config/static.ts";

const BACK = { to: "/books", label: "Books" } as const;

export const Route = createFileRoute("/books/$isbn")({
  loader: async ({ params }) => {
    const book = await getBookDetailData({ data: { isbn: params.isbn } });
    if (!book) {
      throw notFound();
    }
    return book;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: makeTitle(loaderData?.title ?? null) },
      {
        name: "description",
        content: loaderData?.summary ?? SITE_DESCRIPTION,
      },
    ],
  }),
  component: BookDetail,
});

function BookDetail() {
  const book = Route.useLoaderData();
  const tree = useLoaderData({ from: "/books" });
  const header = useMemo(
    () => (
      <BookHeader
        title={book.title}
        authors={book.authors}
        isbn={book.isbn}
        pubYear={book.pubYear}
        publisher={book.publisher}
        readDate={book.readDate}
      />
    ),
    [book.title, book.authors, book.isbn, book.pubYear, book.publisher, book.readDate],
  );

  return (
    <DetailShell
      tree={tree}
      treeKind="books"
      activeSlug={book.slug}
      toc={book.toc}
      backlinks={book.incomingLinks}
      back={BACK}
      tags={book.tags}
      html={book.html}
      header={header}
    />
  );
}
