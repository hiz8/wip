// `site.config.ts` の site フィールドを手動でミラーしたもの。
// 動的な config を import すると `node:fs` などを巻き込むため、クライアント側の
// コードは代わりにこれらのプリミティブを読む。ずれはユニットテストで防いでいる。
export const SITE_NAME = "hiz.blue";
export const SITE_DESCRIPTION = "UI/UX designer, Front-of-the-front-end-ish front-end developer.";
export const SITE_URL = "https://hiz.blue";
export const SITE_LOCALE = "ja";
export const SITE_OG_IMAGE = "/og-default.png";

export const FEED_MAX_ITEMS = 20;
