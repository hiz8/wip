import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "@/styles/tokens.stylex.ts";

interface MarkdownProseProps {
  html: string;
}

const styles = stylex.create({
  prose: {
    color: colors.textPrimary,
  },
});

// `_site/home.md` / `_site/about.md` のレンダリング済み HTML を表示する。詳細本文と
// 同じ `data-content-body` を付与して content.css の prose タイポグラフィを適用する。
// トップページ本文は検索対象外のため `data-pagefind-body` は付けない。
export function MarkdownProse({ html }: MarkdownProseProps) {
  const dangerous = useMemo(() => ({ __html: html }), [html]);
  return (
    <div data-content-body {...stylex.props(styles.prose)} dangerouslySetInnerHTML={dangerous} />
  );
}
