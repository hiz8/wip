import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve as resolvePath } from "node:path";
import stylex from "@stylexjs/unplugin";
import viteReact from "@vitejs/plugin-react";

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
    const trimmed = candidate.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
    for (const ext of STYLEX_EXTENSIONS) {
      const withExt = trimmed + ext;
      if (existsSync(withExt)) return withExt;
    }
  }
  return undefined;
}

export default defineConfig({
  plugins: [
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
  test: {
    globals: false,
    dir: "tests",
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
    testTimeout: 30_000,
  },
  resolve: {
    alias: {
      "@": `${import.meta.dirname}/src`,
    },
  },
});
