// `site.config.ts` の site フィールドを手動でミラーしたもの。
// 動的な config を import すると `node:fs` などを巻き込むため、クライアント側の
// コードは代わりにこれらのプリミティブを読む。ずれはユニットテストで防いでいる。
export const SITE_NAME = "Digital Garden";
export const SITE_DESCRIPTION = "個人ブランディング目的の Digital Garden 型サイト";
export const SITE_URL = "https://example.com";
export const SITE_LOCALE = "ja";
export const SITE_OG_IMAGE = "/og-default.png";

export const FEED_MAX_ITEMS = 20;
