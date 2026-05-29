import { open } from "node:fs/promises";
import { extname } from "node:path";
import type { Connect, Plugin, ViteDevServer } from "vite";
import type { ServerResponse } from "node:http";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
};

async function serveImage(
  req: Connect.IncomingMessage,
  res: ServerResponse,
  next: Connect.NextFunction,
  path: string,
  getMap: () => Promise<ReadonlyMap<string, string>>,
): Promise<void> {
  // ファイルを一度だけ開き、同じハンドルからサイズを読む。こうすることで送出する
  // Content-Length とストリームするバイト列が食い違わない (stat と read の間に
  // TOCTOU がない)。ここでの失敗はいずれも、ヘッダーが 1 つも書かれる前に SSR へ
  // フォールスルーする。
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  let size: number | undefined;
  let absolutePath: string | undefined;
  try {
    const map = await getMap();
    absolutePath = map.get(decodeURIComponent(path));
    if (absolutePath !== undefined) {
      handle = await open(absolutePath, "r");
      const stats = await handle.stat();
      if (stats.isFile()) size = stats.size;
    }
  } catch {
    // dataset ビルドが失敗したか、ファイルが読めない: SSR へフォールスルーする。
    size = undefined;
  }

  if (absolutePath === undefined || handle === undefined || size === undefined) {
    if (handle !== undefined) await handle.close();
    next();
    return;
  }

  const contentType = CONTENT_TYPES[extname(absolutePath).toLowerCase()];
  if (contentType !== undefined) res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", String(size));

  if (req.method === "HEAD") {
    await handle.close();
    res.end();
    return;
  }

  // 開いたハンドルからの createReadStream は fd を自動でクローズする (autoClose は
  // 既定で true)。ヘッダーは既に確定しているため、遅れて発生する read エラーは
  // (もはや部分的な) レスポンスを終了させることしかできない。
  const stream = handle.createReadStream();
  stream.on("error", () => {
    res.end();
  });
  stream.pipe(res);
}

/**
 * Vault の画像を `/images/...` の下で配信する dev 専用の Vite プラグイン。
 *
 * 本番ではプリレンダー済みの HTML が `/images/<publicPath>` を参照し、post-build
 * がファイルを `dist/client/images/` へコピーする。dev サーバーにはそうした
 * コピー工程がないため、この middleware は各 `/images/...` リクエストを Vault 内の
 * ソースファイルへマップしてストリームする。
 *
 * このマッピングは site dataset の imageMapping
 * (publicPath -> resolvedAbsolutePath) から構築した allowlist である。その map に
 * 存在するパスだけが配信されるため、構造上パストラバーサルは不可能。
 */
export function devImagesPlugin(): Plugin {
  return {
    name: "dev-vault-images",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      // 最初の /images/ リクエスト時に dataset を遅延ロードし、逆引き map を
      // キャッシュする。失敗時はリセットし、後続のリクエストが再試行できるようにする。
      let mapPromise: Promise<ReadonlyMap<string, string>> | null = null;
      const getMap = (): Promise<ReadonlyMap<string, string>> => {
        if (mapPromise === null) {
          mapPromise = server
            .ssrLoadModule("/src/server/index.ts")
            .then((mod) => (mod as typeof import("../src/server/index.ts")).getSiteDataset())
            .then((dataset) => {
              const map = new Map<string, string>();
              for (const entry of dataset.imageMapping) {
                map.set(entry.publicPath, entry.resolvedAbsolutePath);
              }
              return map;
            })
            .catch((error: unknown) => {
              mapPromise = null;
              throw error;
            });
        }
        return mapPromise;
      };

      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ?? "";
        const path = rawUrl.split("?", 1)[0] ?? "";
        if (!path.startsWith("/images/")) {
          next();
          return;
        }
        if (req.method !== "GET" && req.method !== "HEAD") {
          next();
          return;
        }

        void serveImage(req, res, next, path, getMap);
      });
    },
  };
}
