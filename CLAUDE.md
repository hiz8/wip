# CLAUDE.md

このファイルは Claude Code がこのリポジトリでコードを操作する際のプロジェクトガイドである。

## プロジェクト概要

Obsidian Vault をソースとした個人ブランディング目的の Digital Garden 型 Web サイト。NAS 上の Vault からローカルビルドで静的サイトを生成し、Cloudflare Workers にデプロイする。

詳細仕様は以下を参照:

- `SPEC.md` — 全体仕様の概要
- `docs/content-spec.md` — コンテンツ仕様 (frontmatter スキーマ、Markdown 拡張記法)
- `docs/ui-spec.md` — UI 仕様 (レイアウト、各ページ構成、レスポンシブ)
- `docs/build-spec.md` — ビルド仕様 (パイプライン、設定ファイル、リンク解決)
- `docs/architecture.md` — アーキテクチャ (技術選定理由、ディレクトリ構成、データフロー)

仕様に関する不明点が生じた場合、これらのドキュメントを最初に参照すること。

## 現在の実装状況

- Phase 1 (コンテンツ収集とパース、Notes のみ) **完了**
- Phase 2 (Markdown 変換とリンク解決、Notes 限定) **完了**
- Phase 3 (TanStack Start SSG、Notes 一覧・詳細ルート) **完了**
- Phase 4 (レイアウト + StyleX + react-aria-components + ダークモード) **完了**
- Phase 5 (Glossary / Books の対応、五十音インデックス、cross-type リンク解決) **完了**
- Phase 6 (Marginalia / TOC アクティブハイライト / バックリンクの type アイコン) **完了**
- Phase 7 (画像コピー / 書影 / sitemap / Atom feed / Pagefind / Cloudflare Workers デプロイ) **完了**
- Phase 8 (デザインの作り込みと style cleanup: 名前付き CSS var、フォント / spacing / WCAG AA、Shiki と Pagefind の dark mode、SearchDialog レスポンシブ) **完了**
- Phase 9 以降は未着手

完了範囲・公開 API・設計判断・次フェーズへの引き継ぎメモは `docs/implementation-log.md` に集約している。実装作業を始める前に必ず参照すること。

## 技術スタック

- **言語**: TypeScript (`strict: true` + 追加の厳格オプション)
- **フレームワーク**: TanStack Start (SSG モード)
- **UI ライブラリ**: react-aria-components
- **スタイリング**: StyleX
- **Markdown**: remark / unified エコシステム
- **シンタックスハイライト**: Shiki
- **検索**: Pagefind
- **テスト**: Vitest
- **リンター・フォーマッター**: oxlint / oxfmt
- **パッケージマネージャ**: npm
- **ホスティング**: Cloudflare Workers (Static Assets)

## よく使うコマンド

現時点で利用可能なもの:

```bash
# 開発サーバー (vite dev)
npm run dev

# 本番ビルド (TanStack Start SSG プリレンダー + 画像コピー / sitemap / feed / pagefind)
npm run build

# ビルド成果物のローカルプレビュー (vite preview)
npm run preview

# Cloudflare Workers にデプロイ
npm run deploy
npm run deploy:dry       # wrangler deploy --dry-run
npm run deploy:preview   # wrangler dev で Workers Static Assets を再現

# 型チェック
npm run typecheck

# テスト (Vitest)
npm run test
npm run test:watch

# リント (oxlint)
npm run lint

# フォーマット (oxfmt)
npm run fmt
```

`npm run dev` / `build` / `preview` は `.env` の `VAULT_ROOT` (または環境変数) で Vault パスを指定する必要がある。

将来の Phase で扱う予定の項目 (Phase 7 では未対応):

- Vault ウォッチモード (変更検知の自動再ビルド) — 差分ビルド整備
- デザインの作り込み (フォント・間隔・カラーパレット・StyleX/CSS の二重定義解消) — Phase 8

## ディレクトリ構成 (要点)

`docs/architecture.md` に詳細あり。要点のみ:

- `src/routes/` — TanStack Start のルート (ファイルベースルーティング)
- `src/components/` — UI コンポーネント (layout / content / tree / card / common に分類)
- `src/lib/content/` — Vault からのコンテンツ収集・パース・バリデーション
- `src/lib/markdown/` — Markdown 変換パイプライン (プラグインを含む)
- `src/lib/linkgraph/` — リンク解決とバックリンク構築
- `src/lib/search/` `src/lib/feed/` `src/lib/config/` — 補助機能
- `src/styles/` — StyleX のテーマトークン
- `src/types/` — 共有型定義
- `tests/fixtures/` — テスト用のモック Vault

## 設計上の重要事項

### コンテンツソースの参照

- Vault は外部の NAS にあり、**リポジトリには含まれない**
- `site.config.ts` と `.env` の `VAULT_ROOT` でパスを指定する
- ローカル開発時のみ Vault を参照可能。CI では fixtures を使用する

### コンテンツタイプ

- **Notes** — Vault 直下、サブフォルダあり、`Glossary/`、`Books/`、`Clips/`、`_site/` は除外する
- **Glossary** — `Glossary/` 配下、フラット
- **Books** — `Books/` 配下、フラット、ファイル名は ISBN
- **Clips** — サイトには含めない (Vault には存在するが除外)

### frontmatter

詳細は `docs/content-spec.md` を参照。要点:

- すべてのコンテンツに `status` (任意、デフォルト `published`) がある
- `status: draft` または `status: archived` は完全に除外
- Notes は `created` と `updated` が必須
- Books は `aliases`、`authors` が必須、`aliases[0]` がメインタイトル
- Glossary は `furigana` を持つ場合、五十音インデックスでソート

### Markdown 拡張記法

- **`[[wiki-link]]`** — 内部リンク。リンク解決ルールは `docs/build-spec.md` の「リンク解決」を参照。非公開リンクはテキスト化、曖昧解決はビルドエラー
- **`![[note]]`** — Embed。1 階層のみ展開。Embed 内の Embed はリンク化
- **`[^1]`** — 脚注。サイト上では Marginalia として表示
- **`> [!note]`** — Callout。サポート種別は `note` / `quote` / `tip` / `info` / `warning` のみ。タイトルに `private` を含むと除外

### URL 構造

- `/notes/[slug]`、`/glossary/[slug]`、`/books/[isbn]`
- slug はファイル名そのまま (拡張子除く)。日本語ファイル名は日本語 URL となる
- トレイリングスラッシュなし
- Notes のサブフォルダ階層は URL に反映しない (フラット)
- 同名ファイルが異なるサブフォルダに存在する場合はビルドエラー

### タグ

- 階層タグ (`frontend/react`) サポート。親タグでフィルタすると子タグも含む
- コンテンツタイプごとに名前空間が分離 (`/notes/tags/react` と `/books/tags/react` は別物)
- 階層タグの URL は `/` を `--` でエスケープ (`frontend/react` → `frontend--react`)

### レイアウト

ページタイプによってレイアウトが異なる (詳細は `docs/ui-spec.md`)。要点:

- **詳細ページ**: アイコンナビ + ツリー + 本文 (左右に Marginalia 領域) + 目次 + バックリンク
- **一覧ページ**: アイコンナビ + ツリー + 一覧 (Marginalia / 右サイドバーなし)
- **トップページ**: アイコンナビ + 専用コンテンツ (ツリー / 右サイドバーなし)

### レスポンシブと Marginalia

- 表示位置切替は純 CSS で行う (Tufte CSS 風の `float` + 負マージン)
- デスクトップ広 (≥1280px): 左右両方のガターに float (build 時の `data-side` で振り分け)
- デスクトップ中 (1024-1279px): 右側のみに float (左 side のものも右へまとめて落ちる)
- モバイル (≤1023px): 脚注は本文末尾の `FootnoteSection` にまとめ、Callout はインライン展開
- ガター列のスペース確保のため `DetailLayout` は 3 段階 grid (`12rem / 1fr / 12rem`) を維持する

### アクセシビリティ

- WCAG 2.2 AA 準拠
- react-aria-components のヘッドレスコンポーネントを活用
- すべての機能をキーボード操作可能に

### ダークモード

- OS 設定追従 (初期値) + ユーザートグル
- StyleX のテーマトークン機能で配色を管理

## ビルドの厳格モード

`build.strict: true` (デフォルト) で以下をビルドエラーとする:

- 必須 frontmatter の欠損
- 曖昧な内部リンク (複数候補が一致)
- 同名 slug の衝突
- 存在しない画像への参照

非公開コンテンツへのリンクはエラーとせず、テキスト化する。

## コーディング方針

### TypeScript

- `strict: true` + `noUncheckedIndexedAccess` 等の追加オプションを有効化
- `any` の使用を避ける。やむを得ない場合は理由をコメントで明記
- 型定義は `src/types/` に集約。コンポーネント固有の型はファイル内に定義可

### コンポーネント

- React 関数コンポーネントを使用
- React 自体の情報を必要とする場合は <https://react.dev/llms.txt> を参照する
- react-aria-components の Hook / Component を優先的に活用
- react-aria もしくは react-aria-components を使用する際は <https://react-aria.adobe.com/llms.txt> を参照する
- スタイリングは StyleX で記述。インラインスタイル / `style` 属性は原則使用しない
- StyleX を使用する際は `docs/stylex-authoring.md` を参照する
- コンポーネントは小さく分割し、責務を明確に

### Markdown 処理

- remark / rehype のプラグインとして実装する
- AST 操作のテストを必ず書く
- プラグインは単機能に保ち、組み合わせて使う

### エラーハンドリング

- ビルド時のエラーは具体的なファイルパスと行番号 (可能なら) を含める
- ユーザー (= 自分) にとって何が問題でどう修正できるかを示す

### テスト

- ユニットテストはロジック層 (`src/lib/`) を優先
- フィクスチャ (`tests/fixtures/`) でモック Vault を構築
- UI コンポーネントのテストは挙動の重要な部分のみ

## 開発の進め方

### 段階的な実装方針

仕様には将来的な拡張も含まれているため、初期実装では以下を優先する:

1. ✅ コンテンツ収集とパース (Notes のみで動く最小構成)
2. ⏳ Markdown 変換とリンク解決
3. ⏳ 基本的なルーティング (Notes 詳細、一覧)
4. ⏳ レイアウト (アイコンナビ、ツリー、本文表示)
5. ⏳ Glossary / Books の対応
6. ⏳ Marginalia / 目次 / バックリンク
7. ⏳ 検索 / RSS / sitemap
8. ⏳ デザインの作り込み

各フェーズの完了状況・引き継ぎメモは `docs/implementation-log.md` を参照。

差分ビルド、画像最適化、動的 OGP は将来的な拡張として扱う。

### 仕様変更が必要な場合

実装過程で仕様の不備や齟齬を見つけた場合、勝手に変更せず、まず仕様ドキュメント (`SPEC.md` / `docs/`) で指針を確認する。それでも判断できない場合は、ユーザーに確認する。

仕様変更の合意が得られた場合は、対応するドキュメントを更新してから実装する。

## 注意事項

- Vault のパスは `.env` の `VAULT_ROOT` で指定。ハードコードしない
- `_site/` 配下の Markdown (自己紹介本文、サイト説明本文) は `pages` セクションで参照
- Vault の構造に依存する処理は、テストで Vault パスをモックできるように設計する
- Cloudflare Workers の制約 (ファイルサイズ、ルーティング上限など) を考慮する

## コミットメッセージ・README・コード内コメントの言語

コミットメッセージと README は英語で記述してください。コード内のコメント (JSDoc を含む) は日本語で記述してください。`// @vitest-environment jsdom` や `// oxlint-disable-next-line …` のような機械可読ディレクティブ、識別子・API 名・属性名は原表記を保ちます。
