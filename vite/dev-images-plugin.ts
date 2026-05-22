import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
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
  let absolutePath: string | undefined;
  let size: number | undefined;
  try {
    const map = await getMap();
    const publicPath = decodeURIComponent(path);
    absolutePath = map.get(publicPath);
    if (absolutePath !== undefined) {
      const stats = await stat(absolutePath);
      if (stats.isFile()) size = stats.size;
    }
  } catch {
    // Dataset build failed or the file is unreadable: fall through to SSR.
    absolutePath = undefined;
  }

  if (absolutePath === undefined || size === undefined) {
    next();
    return;
  }

  const contentType = CONTENT_TYPES[extname(absolutePath).toLowerCase()];
  if (contentType !== undefined) res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Length", String(size));

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  const stream = createReadStream(absolutePath);
  stream.on("error", () => {
    if (!res.headersSent) res.statusCode = 500;
    res.end();
  });
  stream.pipe(res);
}

/**
 * Dev-only Vite plugin that serves Vault images under `/images/...`.
 *
 * In production the prerendered HTML references `/images/<publicPath>` and
 * post-build copies the files into `dist/client/images/`. The dev server has no
 * such copy step, so this middleware maps each `/images/...` request back to its
 * source file in the Vault and streams it.
 *
 * The mapping is an allowlist built from the site dataset's imageMapping
 * (publicPath -> resolvedAbsolutePath). Only paths present in that map are
 * served, which makes path traversal impossible by construction.
 */
export function devImagesPlugin(): Plugin {
  return {
    name: "dev-vault-images",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      // Lazily load the dataset on the first /images/ request and cache the
      // reverse map. On failure we reset so a later request can retry.
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
