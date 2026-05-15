// Public assets path served by Cloudflare Workers Static Assets after
// the post-build script writes the pagefind index under dist/client/.
export const PAGEFIND_BUNDLE_PATH = "/pagefind/pagefind-ui.js";
export const PAGEFIND_CSS_HREF = "/pagefind/pagefind-ui.css";

export interface PagefindUIOptions {
  element: HTMLElement;
  showImages: boolean;
  resetStyles: boolean;
  showSubResults: boolean;
  translations: Record<string, string>;
}

export function makePagefindUIOptions(element: HTMLElement): PagefindUIOptions {
  return {
    element,
    showImages: false,
    resetStyles: false,
    showSubResults: true,
    translations: {
      placeholder: "検索…",
      clear_search: "クリア",
      load_more: "さらに表示",
      search_label: "サイト内検索",
      filters_label: "フィルタ",
      zero_results: "[SEARCH_TERM] に一致する結果はありません",
      many_results: "[SEARCH_TERM] の検索結果: [COUNT] 件",
      one_result: "[SEARCH_TERM] の検索結果: 1 件",
      alt_search:
        "[SEARCH_TERM] に一致する結果はありません。代わりに [DIFFERENT_TERM] を検索しています",
      search_suggestion:
        "[SEARCH_TERM] に一致する結果はありません。以下の検索語をお試しください: [DIFFERENT_TERM]",
      searching: "[SEARCH_TERM] を検索中…",
    },
  };
}
