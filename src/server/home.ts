import { createServerFn } from "@tanstack/react-start";
import { staticFunctionMiddleware } from "@tanstack/start-static-server-functions";
import { projectHomePage } from "./projectHomePage.ts";
import type { HomePageData } from "./projectHomePage.ts";

// 公開する型は projection モジュールから type-only で再エクスポートする (実行時
// import を伴わないため、クライアントへ node:fs が混入しない)。
export type {
  HomePageData,
  HomeRecentItem,
  HomeFeaturedItem,
  HomeCounts,
  HomeSocialLink,
} from "./projectHomePage.ts";

// projectHomePage は datasets/config (node:fs) に依存するサーバ専用モジュールに置く。
// ここでは handler の中でのみ参照するため、TanStack Start の server-fn 変換が
// クライアントバンドルからこの import ごと除去する (loaders.ts と同じ構造)。
// 逆に projectHomePage をこのモジュールから *export* してしまうと、ルートが
// home.ts を import する際にクライアントへ漏れ、dev で `node:fs` 由来の
// "Module node:fs has been externalized" エラーになる。
// staticFunctionMiddleware の理由は loaders.ts のコメントを参照 (static-only デプロイ対応)。
export const getHomePageData = createServerFn({ method: "GET" })
  .middleware([staticFunctionMiddleware])
  .handler((): Promise<HomePageData> => projectHomePage());
