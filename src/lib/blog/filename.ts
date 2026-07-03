// Blog 記事の作成日時はファイル名を唯一の正とする (docs/blog-spec.md)。
// Obsidian / OS のファイル名制約のため ":" は使えず、時刻は HHmm の 4 桁連結。
// フォーマットが固定幅のため、slug の文字列順 = 作成日時順が成り立つ。

export interface BlogArticleDate {
  slug: string;
  /** ISO 8601 (タイムゾーンは site.config.ts の content.blog.timezone) */
  createdIso: string;
  /** 記事ブロックに表示する YYYY/MM/DD */
  displayDate: string;
  /** 全ページで共通の記事アンカー id (空白を "-" に置換して "p-" を前置) */
  anchorId: string;
}

const SLUG_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) ([01]\d|2[0-3])([0-5]\d)$/u;

export function parseBlogSlugDate(slug: string, timezone: string): BlogArticleDate | null {
  const m = SLUG_PATTERN.exec(slug);
  if (!m) return null;
  const year = m[1]!;
  const month = m[2]!;
  const day = m[3]!;
  const hour = m[4]!;
  const minute = m[5]!;

  // 2025-02-30 のような非実在日を検出するため、Date オブジェクトから UTC 日付を取得して検証
  const d = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
  if (
    Number.isNaN(d.getTime()) ||
    d.getUTCFullYear() !== Number.parseInt(year, 10) ||
    d.getUTCMonth() !== Number.parseInt(month, 10) - 1 ||
    d.getUTCDate() !== Number.parseInt(day, 10)
  ) {
    return null;
  }

  const iso = `${year}-${month}-${day}T${hour}:${minute}:00${timezone}`;
  return {
    slug,
    createdIso: iso,
    displayDate: `${year}/${month}/${day}`,
    anchorId: `p-${year}-${month}-${day}-${hour}${minute}`,
  };
}
