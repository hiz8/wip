// Hand-maintained mirror of the site fields in `site.config.ts`.
// Importing the dynamic config pulls in `node:fs` etc., so client-side code
// reads these primitives instead. A unit test guards against drift.
export const SITE_NAME = "Digital Garden";
export const SITE_DESCRIPTION = "個人ブランディング目的の Digital Garden 型サイト";
export const SITE_URL = "https://example.com";
export const SITE_LOCALE = "ja";
export const SITE_OG_IMAGE = "/og-default.png";
