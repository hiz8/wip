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
      exclude: [
        "Glossary/**",
        "Books/**",
        "Blog/**",
        "Clips/**",
        "Clippings/**",
        "_site/**",
        "TIL/**",
        "Templates/**",
        "CLAUDE.md",
      ],
    },
    glossary: {
      path: "Glossary",
    },
    books: {
      path: "Books",
    },
    blog: {
      path: "Blog",
      // /blog/feed.xml の最大件数
      feedMaxItems: 20,
      // ファイル名日時の解釈タイムゾーン
      timezone: "+09:00",
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
