import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";

const fixturesDir = fileURLToPath(new URL("../fixtures", import.meta.url));

export function makeConfig(vaultRelative: string): SiteConfigParsed {
  return {
    site: {
      name: "Test",
      description: "",
      url: "https://example.test",
      locale: "ja",
    },
    author: { name: "Tester" },
    content: {
      vaultRoot: resolve(fixturesDir, vaultRelative),
      notes: {
        path: ".",
        exclude: ["Glossary/**", "Books/**", "Blog/**", "Clips/**", "_site/**"],
      },
      glossary: { path: "Glossary" },
      books: { path: "Books" },
      blog: { path: "Blog", feedMaxItems: 20, timezone: "+09:00" },
    },
    build: { outDir: "dist", publicDir: "public", strict: true },
    features: { rss: true, sitemap: true, search: true },
  };
}
