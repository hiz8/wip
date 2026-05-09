import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";

export const SHIKI_OPTIONS: RehypeShikiOptions = {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  defaultColor: false,
  cssVariablePrefix: "--shiki-",
};

export { rehypeShiki };
