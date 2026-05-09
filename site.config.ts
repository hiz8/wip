import { defineConfig } from "@/lib/config/define.ts";

export default defineConfig({
  site: {
    name: "Digital Garden",
    description: "個人ブランディング目的の Digital Garden 型サイト",
    url: "https://example.com",
    locale: "ja",
    ogImage: "/og-default.png",
  },
  author: {
    name: "(著者名)",
    bio: "(簡潔な紹介)",
    socialLinks: [],
  },
  content: {
    vaultRoot: process.env["VAULT_ROOT"] ?? "",
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
  pages: {
    home: {
      introMarkdown: "_site/home.md",
      aboutMarkdown: "_site/about.md",
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
