import { defineConfig } from "@/lib/config/define.ts";

export default defineConfig({
  site: {
    name: "Test Site",
    description: "Test",
    url: "https://example.test",
    locale: "ja",
  },
  author: {
    name: "Tester",
  },
  content: {
    vaultRoot: "../vault",
    notes: {
      path: ".",
      exclude: ["Glossary/**", "Books/**", "Clips/**", "_site/**"],
    },
    glossary: {
      path: "Glossary",
    },
    books: {
      path: "Books",
    },
  },
  build: {
    outDir: "dist",
    publicDir: "public",
    strict: true,
  },
  features: {
    rss: true,
    sitemap: true,
    search: true,
  },
});
