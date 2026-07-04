// Blog タグツリーの開閉状態。ルート遷移でサイドバーが remount されても
// 「操作していた枝が開いたまま残る」(docs/blog-spec.md) を満たすため、
// モジュールスコープに退避する。SSR では毎リクエスト新規モジュールにはならないが、
// 初期描画はコールド既定展開 (正規チェーン) を使うため実害はない。
let stored: ReadonlySet<string> | null = null;

export function loadTreeExpansion(): ReadonlySet<string> | null {
  return stored;
}

export function saveTreeExpansion(keys: ReadonlySet<string>): void {
  stored = new Set(keys);
}

export function __resetTreeExpansionForTests(): void {
  stored = null;
}
