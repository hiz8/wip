import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve as resolvePath } from "node:path";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import stylex from "@stylexjs/unplugin";

const projectRoot = `${import.meta.dirname}/`;
const srcRoot = `${import.meta.dirname}/src/`;
const STYLEX_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function resolveStylexImport(importPath: string, sourceFilePath: string): string | undefined {
  const candidates: string[] = [];
  if (importPath.startsWith("@/")) {
    candidates.push(resolvePath(srcRoot, importPath.slice(2)));
  } else if (importPath.startsWith(".")) {
    candidates.push(resolvePath(dirname(sourceFilePath), importPath));
  } else if (isAbsolute(importPath)) {
    candidates.push(importPath);
  } else {
    return undefined;
  }
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
    const trimmed = candidate.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/u, "");
    for (const ext of STYLEX_EXTENSIONS) {
      const withExt = trimmed + ext;
      if (existsSync(withExt)) return withExt;
    }
  }
  return undefined;
}

export default defineConfig({
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        failOnError: true,
      },
    }),
    // oxlint-disable-next-line import/no-named-as-default-member -- types only ship via default
    stylex.vite({
      useCSSLayers: true,
      unstable_moduleResolution: {
        type: "custom",
        filePathResolver: (importPath, sourceFilePath) =>
          resolveStylexImport(importPath, sourceFilePath),
        getCanonicalFilePath: (filePath) => {
          const rel = filePath.startsWith(projectRoot)
            ? filePath.slice(projectRoot.length)
            : filePath;
          return rel.replaceAll("\\", "/");
        },
      },
    }),
    viteReact(),
  ],
});
