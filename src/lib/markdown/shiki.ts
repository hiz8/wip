import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";

let cachedOptions: RehypeShikiOptions | null = null;

export function getShikiOptions(): RehypeShikiOptions {
  if (cachedOptions) return cachedOptions;
  cachedOptions = {
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
    cssVariablePrefix: "--shiki-",
  } satisfies RehypeShikiOptions;
  return cachedOptions;
}

export { rehypeShiki };
