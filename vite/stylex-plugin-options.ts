import { existsSync } from "node:fs";
import { dirname, isAbsolute, resolve as resolvePath } from "node:path";
import type { UserOptions } from "@stylexjs/unplugin";

const projectRoot = `${resolvePath(import.meta.dirname, "..")}/`;
const srcRoot = `${projectRoot}src/`;
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

/**
 * `@stylexjs/unplugin` のオプションを生成する。アプリ本体 (vite.config.ts) と
 * Storybook (.storybook/vite.config.ts) の両方から使う。変換設定が食い違うと
 * 生成されるクラス名・CSS 変数名が一致しなくなるため、必ずここを共有する。
 */
export function createStylexPluginOptions(): Partial<UserOptions> {
  return {
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
  };
}
