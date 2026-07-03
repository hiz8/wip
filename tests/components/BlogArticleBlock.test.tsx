// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { BlogArticleBlock } from "@/components/blog/BlogArticleBlock.tsx";
import type { BlogArticleDto } from "@/server/loaders.ts";

const base: BlogArticleDto = {
  slug: "2025-12-11 0930",
  anchorId: "p-2025-12-11-0930",
  displayDate: "2025/12/11",
  html: "<p>本文</p>",
  footnotes: [],
  idPrefix: "p-2025-12-11-0930-",
  isCanonicalPage: false,
  otherTags: {
    labels: ["マイクロコピー", "ライティング"],
    tagset: "UI-UX+マイクロコピー+ライティング",
    page: 1,
  },
};

// react-perf(jsx-no-new-object-as-prop) を満たすため、JSX に渡すオブジェクトは
// モジュールスコープの定数として持つ (`base` と同じ方針)。
const WITHOUT_OTHER_TAGS: BlogArticleDto = { ...base, otherTags: null };
const CANONICAL_ARTICLE: BlogArticleDto = { ...base, isCanonicalPage: true };

function renderWithRouter(ui: ReactNode) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const make = (p: string) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: p,
      component: () => null,
    });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      make("/blog/tags/$tagset"),
      make("/blog/tags/$tagset/page/$n"),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
    // 本番の router.tsx と同じ設定 (tagset の "+" 区切りを percent-encode させない)
    pathParamsAllowedCharacters: ["+"],
  });
  return render(<RouterProvider router={router} />);
}

describe("BlogArticleBlock", () => {
  it("作成日見出しにアンカー id を付ける", async () => {
    renderWithRouter(<BlogArticleBlock article={base} />);
    const heading = await screen.findByRole("heading", { name: "2025/12/11" });
    expect(heading.id).toBe("p-2025-12-11-0930");
  });

  it("それ以外のタグはクラスタで 1 リンク、正規ページ + アンカーへ向く", async () => {
    renderWithRouter(<BlogArticleBlock article={base} />);
    const link = await screen.findByRole("link", { name: "#マイクロコピー#ライティング" });
    const href = link.getAttribute("href")!;
    // TanStack Router は非 ASCII を percent-encode する (router.tsx の
    // pathParamsAllowedCharacters は "+" のみを平文化する設定) ため、Unicode 部分は
    // decodeURIComponent してから比較する。"+" 自体は生のまま出るはずなのでそちらは直接検証する。
    expect(href).toContain("/blog/tags/UI-UX+");
    expect(decodeURIComponent(href)).toContain("/blog/tags/UI-UX+マイクロコピー+ライティング");
    expect(href).toContain("#p-2025-12-11-0930");
  });

  it("otherTags が null なら併記を出さない", async () => {
    renderWithRouter(<BlogArticleBlock article={WITHOUT_OTHER_TAGS} />);
    await waitFor(() => expect(screen.getByRole("heading")).toBeInTheDocument());
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("isCanonicalPage のときのみ data-pagefind-body を付ける", async () => {
    const { container } = renderWithRouter(<BlogArticleBlock article={base} />);
    await waitFor(() => expect(container.querySelector("h2")).not.toBeNull());
    expect(container.querySelector("[data-pagefind-body]")).toBeNull();

    const { container: canonicalContainer } = renderWithRouter(
      <BlogArticleBlock article={CANONICAL_ARTICLE} />,
    );
    await waitFor(() => expect(canonicalContainer.querySelector("h2")).not.toBeNull());
    expect(canonicalContainer.querySelector("[data-pagefind-body]")).not.toBeNull();
  });
});
