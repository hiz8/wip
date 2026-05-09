# 実装ログ

各フェーズの完了状況、主要 API、設計判断、次フェーズへの引き継ぎメモを記録する。
別チャット / 別セッションへ作業を引き継ぐための一次ソース。

段階分けは `CLAUDE.md` の「段階的な実装方針」に対応する。

## サマリ

| Phase | 内容                                    | 状態           | 完了日     |
| ----- | --------------------------------------- | -------------- | ---------- |
| 1     | コンテンツ収集とパース (Notes 最小構成) | ✅ Done        | 2026-05-09 |
| 2     | Markdown 変換とリンク解決 (Notes 限定)  | ✅ Done        | 2026-05-09 |
| 3     | 基本的なルーティング (Notes 詳細・一覧) | ✅ Done        | 2026-05-09 |
| 4     | レイアウト (アイコンナビ・ツリー・本文) | ⏳ Not started | —          |
| 5     | Glossary / Books の対応                 | ⏳ Not started | —          |
| 6     | Marginalia / 目次 / バックリンク        | ⏳ Not started | —          |
| 7     | 検索 / RSS / sitemap                    | ⏳ Not started | —          |
| 8     | デザインの作り込み                      | ⏳ Not started | —          |

## Phase 1 — コンテンツ収集とパース ✅

### 達成範囲

- プロジェクトのブートストラップ (TypeScript / Vitest / oxlint / oxfmt)
- 設定システム (`defineConfig` + zod + `.env` マージ)
- Notes コンテンツ収集パイプライン (列挙 → frontmatter パース → バリデーション → status フィルタ → slug 衝突検出)
- ビルドエラー型 (`BuildError`) と整形ヘルパー
- フィクスチャ Vault 3 種 (正常 / 不正 frontmatter / slug 衝突)
- ユニットテスト 26 件

### 公開 API

`src/lib/content/index.ts` から以下をエクスポート:

- `collectNotes(config: SiteConfigParsed): Promise<ContentItem<NotesFrontmatter>[]>`
  - 公開済み (`status: published` または未指定) の Notes のみを返す
  - `draft` / `archived` は除外
  - frontmatter エラー / slug 衝突は `BuildError` を throw
- `collectNoteFiles`, `parseMarkdownFile`, `validateNotesFrontmatter`, `isPublished`, `deriveSlug`, `assertUniqueSlugs`
- `BuildError`, `formatBuildError`, `BuildErrorCategory`, `BuildErrorDetails`

`src/lib/config/index.ts` から:

- `defineConfig(config)` — site.config.ts で型補完を効かせるためのヘルパー
- `loadConfig(options?)` — site.config.ts と `.env` を読み込み、zod でパースし `vaultRoot` を絶対パス解決
- `siteConfigSchema`, `SiteConfigParsed`

### 主要ファイル

```
site.config.ts                      # ルート設定 (テンプレート、VAULT_ROOT は env から)
src/types/content.ts                # ContentType, Status, *Frontmatter, ContentItem
src/types/config.ts                 # SiteConfig 関連の型
src/lib/config/schema.ts            # zod スキーマ
src/lib/config/define.ts            # defineConfig
src/lib/config/load.ts              # loadConfig (.env マージ + vaultRoot 検証)
src/lib/config/index.ts             # 公開 API
src/lib/content/errors.ts           # BuildError
src/lib/content/collect.ts          # tinyglobby による列挙
src/lib/content/parse.ts            # gray-matter による frontmatter 分離
src/lib/content/validate.ts         # Notes frontmatter バリデーション
src/lib/content/slug.ts             # slug 生成 + 衝突検出
src/lib/content/index.ts            # collectNotes
tests/fixtures/vault/               # 通常ケースのモック Vault
tests/fixtures/vault-invalid/       # frontmatter 不正ケース
tests/fixtures/vault-collision/     # slug 衝突ケース
tests/fixtures/configs/             # loadConfig 用テンプレート
tests/lib/content/*.test.ts         # ユニット 26 件
```

### 設計判断 (Phase 2 以降に影響)

1. **`ContentItem` は最小型** — 現在は `{ type, slug, filePath, absolutePath, frontmatter, body }` のみ。仕様 (`docs/architecture.md`) で挙げられている `html` / `toc` / `outgoingLinks` / `incomingLinks` は Phase 2 で型を拡張して追加する。Phase 1 で先回りすると未使用フィールドが増えるため、段階的に育てる方針を採った
2. **frontmatter の YAML 日付** — Obsidian は `created: 2025-01-01` のような未クォートの日付を書きがち。YAML パーサーが Date オブジェクトに変換するので、`validate.ts` の `isoDateString` で `z.preprocess` を使い `Date → toISOString()` に正規化している。新しい frontmatter スキーマを追加する際もこの方針を踏襲すること
3. **`exactOptionalPropertyTypes: true`** — オプショナルフィールドに `undefined` を明示代入できない。`applyDefaults` のように、未定義時はキーごと省く実装にする必要がある (例: `validate.ts` の `applyDefaults`)
4. **zod v4 のデフォルト値** — `.default({})` は型エラーになる。空オブジェクトで子のデフォルトを発火させたい場合は `.prefault({})` を使う (`schema.ts` 参照)
5. **import パスは `.ts` 拡張子付き** — `verbatimModuleSyntax` + `allowImportingTsExtensions` の組み合わせのため。新規ファイルでも統一する
6. **エイリアス `@/*` → `src/*`** — `tsconfig.json` と `vitest.config.ts` の両方で設定済み
7. **BuildError** — `category` / `filePath` / `field` を必ず保持。新しいエラー種別を増やすときは `BuildErrorCategory` を拡張する

### Phase 1 で意図的に導入していない依存

Phase 2 以降の該当タイミングで導入する:

- **TanStack Start / React / react-aria-components** — Phase 3 (ルーティング着手時)
- **StyleX** — Phase 4 (レイアウト着手時)
- **remark / rehype / unified / remark-gfm 等** — Phase 2
- **Shiki** — Phase 2
- **Pagefind** — Phase 7
- **wrangler / @cloudflare/workers-types** — デプロイ着手時

### 利用可能なコマンド

```bash
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run test:watch   # vitest (watch)
npm run lint         # oxlint
npm run fmt          # oxfmt
```

`dev` / `build` / `preview` / `deploy` はまだ未実装 (該当 Phase で追加する)。

## Phase 2 — Markdown 変換とリンク解決 ✅

### 達成範囲

- Markdown → mdast 変換 (`unified` + `remark-parse` + `remark-gfm`)
- wiki-link 解決 (Notes 限定。`[[X]]` / `[[X|alias]]` / `[[Notes/X]]`、section 指定はリゾルブ時に無視、曖昧解決は `BuildError`)
- Embed 展開 (ブロック単独 `![[X]]` のみ。1 階層、内部 Embed はリンクに降格、自己 Embed は `BuildError`)
- 画像参照収集 (`![[image.ext]]` と `![](url)` の両方。`vaultRoot` 起点の絶対パスと相対パスを resolve、外部 URL は素通し)
- Callout 変換 (`note` / `quote` / `tip` / `info` / `warning`、未対応種別は `note` 扱い、タイトルに `private` を含むものはツリーから除去、`data-callout` 属性付与)
- TOC 抽出 (H2/H3。`github-slugger` で `rehype-slug` 互換 id を発番)
- 脚注抽出 (定義をツリーから取り除き、各定義を独立した HTML へレンダリング。本文の参照マーカーは保持)
- HTML 化 (`remark-rehype` → `rehype-slug` → `@shikijs/rehype` → `rehype-stringify`、Shiki テーマは light/dark の CSS 変数式)
- リンクグラフ構築 (`outgoingLinks` 集計 → `incomingLinks` 逆引き、同一ソース重複排除、`updated` 降順)
- ユニット + 統合テスト 49 件追加 (Phase 1 の 26 件と合わせて合計 75 件)

### 公開 API

`src/lib/markdown/index.ts` から:

- `renderNotes(items: ContentItem<NotesFrontmatter>[], config: SiteConfigParsed): Promise<RenderedNote[]>`
  - 入力は Phase 1 の `collectNotes` の結果。出力は html・title・toc・outgoingLinks・incomingLinks・footnotes・callouts・images を備えた `RenderedNote[]`
  - Notes 索引のみで動作 (Phase 5 で Glossary / Books を `buildContentIndex` に足して拡張する)
- 型再エクスポート: `RenderedItem`, `RenderedNote`, `TocEntry`, `OutgoingLink`, `BacklinkRef`, `FootnoteEntry`, `CalloutEntry`, `CalloutKind`, `ImageRef`

`src/lib/linkgraph/index.ts` から:

- `buildContentIndex(items)` / `resolveLinkTarget(index, options)` — Notes 限定の名前解決。Phase 5 で `aliases` / `term` 索引を同所に追加する想定
- `buildBacklinks(drafts)` / `attachBacklinks(drafts, map)`

### 主要ファイル

```
src/types/content.ts                          # Rendered* 系を追加
src/lib/markdown/pipeline.ts                  # renderNotes 本体
src/lib/markdown/shiki.ts                     # @shikijs/rehype 設定 (light/dark CSS 変数)
src/lib/markdown/index.ts                     # 公開 API
src/lib/markdown/plugins/wiki-link.ts         # [[X]] / ![[X]] (非画像) のリンク化
src/lib/markdown/plugins/embed.ts             # ブロック ![[X]] 展開、自己 Embed エラー
src/lib/markdown/plugins/callout.ts           # blockquote → data-callout、private 除外
src/lib/markdown/plugins/footnote.ts          # 定義抽出 → footnotes メタデータ
src/lib/markdown/plugins/toc.ts               # H2/H3 抽出 + extractFirstH1
src/lib/markdown/plugins/image.ts             # 画像参照収集
src/lib/markdown/plugins/image-util.ts        # 画像拡張子判定
src/lib/linkgraph/resolve.ts                  # buildContentIndex / resolveLinkTarget
src/lib/linkgraph/graph.ts                    # buildBacklinks / attachBacklinks
src/lib/linkgraph/index.ts                    # 公開 API
tests/fixtures/vault-markdown/                # 統合テスト用フィクスチャ (link / embed / callout / footnote / code / image / toc)
tests/fixtures/vault-markdown-self-embed/     # 自己 Embed エラー検証用
tests/lib/markdown/*.test.ts                  # 各プラグイン + pipeline 統合
tests/lib/linkgraph/*.test.ts                 # resolve / graph
```

### 設計判断 (Phase 3 以降に影響)

1. **`RenderedItem<F>` を新設し、Phase 1 の `ContentItem<F>` は変更しない** — 収集ステージとレンダリングステージを型レベルで分離。Phase 5 では `RenderedItem<GlossaryFrontmatter>` 等を同パターンで足せる
2. **wiki-link / embed / image / callout は自前の remark プラグイン** — Notes 限定 → Glossary/Books の段階的追加、曖昧解決のビルドエラー、`private` callout の除去といった独自ルールに合わせるため。コミュニティ製 (`remark-wiki-link` 等) は採用していない
3. **Embed はブロック単独段落 (`![[X]]` のみで構成される段落) に限定** — インライン位置の `![[X]]` (非画像) は `[[X]]` 同様 wiki-link 扱いとなる。仕様上「インライン Embed」は要件外で、簡略化と引き換え
4. **embed の Source リンク** — 展開した本文を `<blockquote data-embed="true">` でラップし、末尾に `Source: <link>` 段落を追加。Phase 4 で見た目を整える
5. **callout の id とメタデータ** — `callout-N` を `id` に発番。本文中にも blockquote をそのまま残す (`data-callout` 属性付き)。Marginalia 化の選択は Phase 6 が決める
6. **footnote はツリーから定義を完全除去** — 末尾の脚注セクション (remark-rehype が定義から生成) は出力されない。本文内の参照マーカーは保持されるが href は宙に浮く。Phase 6 で Marginalia へリンクを張り直す
7. **リンク解決は case-insensitive** — Obsidian 互換。Phase 1 の `assertUniqueSlugs` (大小区別) と整合しない大文字違いのファイルがあると `link-resolution` の `BuildError` を投げる
8. **Shiki のテーマ** — `github-light` / `github-dark` の二系統を CSS 変数 (`--shiki-*`) で出力。Phase 8 で StyleX のトークンと統合する想定
9. **画像の存在検証は未実装** — Phase 7 で `image-reference` カテゴリの BuildError + `public/` へのコピーを実装する。Phase 2 では参照リストの収集のみ
10. **新カテゴリは追加していない** — `BuildErrorCategory` はそのまま (`link-resolution` を embed/wiki-link 共用)

### Phase 2 で意図的に未実装

Phase 5 / 6 / 7 で対応:

- Glossary / Books のリンク解決 (`aliases` / `term` 一致) — Phase 5
- Marginalia 配置と footnote リンクの再ターゲット — Phase 6
- 画像コピーと存在検証 — Phase 7
- StyleX を使った callout / shiki ブロックのスタイリング — Phase 4 / 8

## Phase 3 — 基本的なルーティング ✅

### 達成範囲

- TanStack Start (1.167.x) + TanStack Router (1.169.x) を **SSG モード** で導入。`vinxi` は不要 (2025 年中に廃止)、設定は `vite.config.ts` 単一ファイルに集約
- ファイルベースルーティング (3 ルート):
  - `/` — トップ (Notes へのリンクのみのプレースホルダ)
  - `/notes` — 一覧 (`updated` 降順)
  - `/notes/$slug` — 詳細 (`RenderedNote.html` を `dangerouslySetInnerHTML` で流し込む)
- プリレンダー: `prerender: { enabled: true, crawlLinks: true }`。`/notes` 一覧ページの `<Link>` を辿って全 slug を自動プリレンダー (日本語 slug は URL エンコードされて出力される)
- npm scripts: `dev` / `build` / `preview` を追加
- `npm run build` の出力は `dist/client/` (静的 HTML) と `dist/server/` (SSR バンドル)。Phase 3 では Cloudflare 向けのフラット化は未対応 (Phase 7 で対応)
- ユニットテスト 4 件追加 (合計 79 件)

### 公開 API

`src/server/index.ts` から:

- `getAllNotes(): Promise<RenderedNote[]>` — 全ての公開 Note を `updated` 降順で返す。**ビルドプロセス内で memoize** されるので、複数ルートのローダーから呼んでも `loadConfig + collectNotes + renderNotes` は 1 回しか走らない
- `getNoteBySlug(slug: string): Promise<RenderedNote | undefined>` — slug から Note を取得。未知の slug は `undefined`
- `NotesDataset` 型再エクスポート

`src/lib/config/index.ts` から (Phase 3 で追加):

- `resolveConfig(raw, options?)` — 既にインポート済みの config オブジェクトを zod でパースし、`vaultRoot` を絶対パス化して返す。`loadConfig` から動的 import 部分を分離したもの。SSR バンドル内で `site.config.ts` を **静的に** 取り込みたい場合に使用
- 型 `ResolveConfigOptions`

### 主要ファイル

```
vite.config.ts                       # tanstackRouter + tanstackStart + viteReact
src/router.tsx                       # getRouter() を export (TanStack Start の規約)
src/routes/__root.tsx                # 最小ドキュメントシェル (HeadContent / Outlet / Scripts)
src/routes/index.tsx                 # / プレースホルダ
src/routes/notes/index.tsx           # /notes 一覧
src/routes/notes/$slug.tsx           # /notes/$slug 詳細
src/server/notes.ts                  # 静的 import + memoize された getAllNotes / getNoteBySlug
src/server/index.ts                  # 公開 API
src/lib/config/load.ts               # resolveConfig を切り出し (loadConfig は不変)
tests/server/notes.test.ts           # データ層ユニット 4 件
src/routeTree.gen.ts                 # tanstackRouter プラグインが生成 (gitignore)
```

### 設計判断 (Phase 4 以降に影響)

1. **`resolveConfig` を分離** — Vite の SSR バンドルでは `await import("site.config.ts")` できない (TS ファイルを Node が直接読めない)。`site.config.ts` を **静的 import** で SSR バンドルに含めるため、`loadConfig` から「動的 import」と「parse + resolve」を切り分けた。`loadConfig` は今後もスクリプト・テストから使える
2. **データ層は `src/server/` に配置** — TanStack Start の `*.server.ts` 規約は採用していない (Phase 4 以降で createServerFn 等が必要になったら検討)。現状は `src/server/notes.ts` をルートのローダーから直接 import している
3. **ローダー戻り値はシリアライズしやすい形に最小化** — `/notes` 一覧は `{slug, title, updated, summary}` のみ、詳細は `{slug, title, created, updated, tags, html}` のみを loader から返す。`outgoingLinks` / `incomingLinks` / `footnotes` / `callouts` / `images` は Phase 4・6 で必要になったタイミングで追加
4. **`crawlLinks: true` で動的ルートをプリレンダー** — `/notes` 一覧が公開済み Note を全件 `<Link>` で並べるため、明示的な `pages` 配列は不要。Glossary / Books が増えても同じ手法で拡張できる
5. **`dangerouslySetInnerHTML` で HTML 注入** — Vault は信頼できるソース、Phase 2 の sanitize なし HTML をそのまま流し込む。Phase 8 で hardening を再評価
6. **`react-aria-components` は依存追加のみで未使用** — Phase 4 のレイアウト着手時に Tree / Disclosure / Tabs 等で活用する想定
7. **client バンドルへの node:\* 警告** — ローダー内で `getAllNotes` を呼んでいるため、`@/lib/config/load.ts` 等が client バンドルにも含まれ、ビルド時に「Module 'node:fs' has been externalized for browser compatibility」の警告が大量に出る。プリレンダー後はクライアント側でローダーが再実行されない (キャッシュデータを使う) ため実害はないが、Phase 4 で `createServerFn` か `*.server.ts` 規約による隔離を検討する
8. **`tsconfig` の差分** — `jsx: "react-jsx"`、`lib` に `DOM` / `DOM.Iterable` を追加、`include` に `vite.config.ts` を追加。`verbatimModuleSyntax: true` と `allowImportingTsExtensions: true` は維持 (.tsx でも `.ts` 拡張子付き import を踏襲)

### Phase 3 で意図的に未実装

- レイアウト・スタイリング (StyleX 含む) — Phase 4
- Glossary / Books のルート — Phase 5
- Marginalia (脚注 / Callout を本文左右に再配置)・TOC ハイライト・バックリンク UI — Phase 6
- 検索・RSS・sitemap・画像コピー — Phase 7
- Cloudflare Workers Static Assets 向けの出力フラット化、`@cloudflare/vite-plugin`、`wrangler.jsonc` — Phase 7

### 利用可能なコマンド

```bash
npm run dev          # vite dev
npm run build        # vite build (SSG プリレンダー込み)
npm run preview      # vite preview
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run test:watch   # vitest (watch)
npm run lint         # oxlint
npm run fmt          # oxfmt
```

`npm run build` は `VAULT_ROOT` 環境変数で Vault パスを指定する必要がある (例: `VAULT_ROOT=$PWD/tests/fixtures/vault npm run build`)。

## Phase 4 — レイアウト (引き継ぎメモ)

### 想定スコープ

- AppShell / IconNav / TreeSidebar / DetailLayout のレイアウトコンポーネント (`docs/ui-spec.md`「全体レイアウト」)
- StyleX の導入 (テーマトークン、リセット CSS、ライト・ダーク双方の配色)
- react-aria-components の Tree / Disclosure / TextField を Notes ツリーに適用
- 詳細ページのヘッダ / 目次 (TOC) / バックリンク UI を Phase 2 のメタデータから組み立てる (情報構造のみ。Marginalia 配置は Phase 6)
- 一覧ページのカード型 UI

### 推奨アプローチ

- **`createServerFn` または `*.server.ts` への移行を検討** — 現状は `src/server/notes.ts` がルートから直接 import されているため client バンドルにも file-IO コードが入る。レイアウトで子コンポーネントが増えるとさらに膨れる懸念がある。Phase 4 で隔離するのが望ましい
- **ローダー戻り値の拡張** — TOC / バックリンクの UI 化に合わせて `/notes/$slug` のローダーから `toc` / `incomingLinks` を返す。Phase 3 で意図的にカットしたフィールドを順次戻す
- **StyleX のテーマ** — `src/styles/tokens.stylex.ts` / `theme.stylex.ts` を新設。Phase 2 で Shiki が `--shiki-light` / `--shiki-dark` の CSS 変数を発行しているので、StyleX のトークンと整合させる
- **`<head>` 動的化** — `__root.tsx` の `head` を「サイト名 / ページタイトル」に応じて切り替え。`createFileRoute` の `head` でルートごとの `<title>` / `<meta>` を上書きする
- **CSS リセット** — `src/styles/reset.css` を導入し、`__root.tsx` から `<link rel="stylesheet" href="/reset.css">` する (もしくは StyleX の global API)

### 着手前の確認

- `docs/ui-spec.md`「全体レイアウト」「左サイドバー」「メインコンテンツ」を再読
- `docs/architecture.md`「ディレクトリ構成」の `src/components/` セクションを再読
- TanStack Start の HEAD 管理仕様 (https://tanstack.com/start/latest/docs/framework/react/guide/document-head)
- 仕様の不備があれば `CLAUDE.md`「仕様変更が必要な場合」のフロー

## Phase 4 〜 8 (概要のみ)

| Phase | 主な作業                                                                 | 主要参照                                                    |
| ----- | ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 4     | AppShell / IconNav / TreeSidebar / DetailLayout、StyleX 導入             | `docs/ui-spec.md`「全体レイアウト」                         |
| 5     | Glossary / Books の収集・パース・ルート、五十音インデックス、ISBN slug   | `docs/content-spec.md`, `docs/ui-spec.md`「Glossary/Books」 |
| 6     | Marginalia 配置、TOC ハイライト (IntersectionObserver)、バックリンク表示 | `docs/ui-spec.md`「Marginalia」「右サイドバー」             |
| 7     | Pagefind、RSS、sitemap、画像コピー                                       | `docs/build-spec.md`「サイトマップ・RSS」「画像処理」       |
| 8     | デザイントークン詰め、ダークモード、レスポンシブ調整                     | `docs/ui-spec.md`「ダークモード」「レスポンシブ」           |

差分ビルド・画像最適化・動的 OGP は本ロードマップ外 (将来課題)。

## ログ更新ルール

- フェーズ完了時にこのファイルを更新する (達成範囲・公開 API・主要ファイル・設計判断)
- 次フェーズの「引き継ぎメモ」も同タイミングで更新する
- 完了済みフェーズの「引き継ぎメモ」は履歴として残してよいが、必要に応じて簡略化する
