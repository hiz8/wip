import { useCallback, useSyncExternalStore } from "react";

// matchMedia は "@media" プレフィックスを受け付けないため外す。
// (StyleX 用の media query 文字列をそのまま流用できるようにする。)
function toMatchMediaQuery(query: string): string {
  return query.replace(/^@media\s+/u, "");
}

const getServerSnapshot = () => 0;

/**
 * hide 用 media query のマッチ数 (= メニューへ退避された末尾セクション数) を返す。
 * queries は狭いビューポートほど多くマッチする入れ子なので、マッチ数だけで退避範囲が決まる。
 * SSR では 0 を返す。メニューは JS ありでのみ開ける UI のため、hydration 後に
 * 正しい値へ更新されれば表示の不整合は起きない。
 */
export function useOverflowCount(queries: readonly string[]): number {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const lists = queries.map((query) => window.matchMedia(toMatchMediaQuery(query)));
      for (const list of lists) list.addEventListener("change", onStoreChange);
      return () => {
        for (const list of lists) list.removeEventListener("change", onStoreChange);
      };
    },
    [queries],
  );
  const getSnapshot = useCallback(
    () =>
      queries.reduce(
        (count, query) => (window.matchMedia(toMatchMediaQuery(query)).matches ? count + 1 : count),
        0,
      ),
    [queries],
  );
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
