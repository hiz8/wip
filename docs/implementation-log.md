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
| 4     | レイアウト (アイコンナビ・ツリー・本文) | ✅ Done        | 2026-05-10 |
| 5     | Glossary / Books の対応                 | ✅ Done        | 2026-05-10 |
| 6     | Marginalia / 目次 / バックリンク        | ✅ Done        | 2026-05-11 |
| 7     | 検索 / RSS / sitemap / 画像 / デプロイ  | ✅ Done        | 2026-05-16 |
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

## Phase 4 — レイアウト + StyleX + react-aria-components ✅

### 達成範囲

- StyleX を導入 (`@stylexjs/stylex` + `@stylexjs/unplugin`)。`vite.config.ts` に `stylex.vite()` を組み込み、TypeScript の `.ts` 拡張子付き import を解決するカスタム `unstable_moduleResolution` を定義
- デザイントークン: `src/styles/tokens.stylex.ts` に `colors` / `space` / `radius` / `typography` / `shadow` の 5 グループを `defineVars` で定義。`colors` のみ `@media (prefers-color-scheme: dark)` のデフォルトを持つ
- ライト・ダークの override テーマ: `src/styles/theme.stylex.ts` で `lightTheme` / `darkTheme` を `createTheme` で作成し、StyleX が emit した className を `themeClasses` として export
- ブレークポイント: 各レイアウトコンポーネントの先頭に **フラットな string const** (`const BP_TABLET = "@media (min-width: 768px)"`) で宣言 (StyleX の `unstable_moduleResolution.type: "custom"` 下で他ファイルから `@media` 文字列を import すると `var(--hash)` の theme ref に変換され、`enableMediaQueryOrder` を迂回して上書きが起きるため)
- CSS リセット: `src/styles/reset.css` (`@layer reset`) を `src/router.tsx` から import
- レイアウトコンポーネント: `AppShell` (variant: home / list / detail), `IconNav`, `TreeSidebar`, `DetailLayout`, `RightSidebar`
- ツリー UI: `react-aria-components` の `<Tree>` / `<TreeItem>` / `<TextField>` を `ContentTree` / `TreeSearch` で活用。フィルタ入力で対象外を非表示にし、ヒットしたフォルダを自動展開
- カード UI: `NoteCard` (タイトル / summary / tags / updated)
- TOC: `Toc` コンポーネント (`<nav>` + ネストリスト、見出しなしなら非描画)。`IntersectionObserver` ハイライトは Phase 6
- バックリンク: `Backlinks` コンポーネント (`BacklinkRef[]` をリスト表示、空なら非描画)
- ダークモード: 3 状態 (`system → light → dark`) のトグルを `ThemeToggle` で実装。`useSyncExternalStore` で `localStorage` + `matchMedia` を購読し、`<html>` の className とデータ属性を切り替え
- FOUC 抑止: `__root.tsx` の `<head>` 先頭にインライン `<script>` を注入。`themeScript.ts` が StyleX が emit した className を直接書き出すため、ペイント前にユーザー設定が反映される
- Server isolation: `createServerFn` で `getNotesIndexData` / `getNoteDetailData` / `getNotesTreeData` をラップ。これにより client バンドルから `node:fs` 等の externalize 警告が完全に消えた (Phase 3 で残した宿題を解消)
- ルートのローダー戻り値拡張: `/notes/$slug` のローダーが `toc` と `incomingLinks` を再び返すように
- HEAD 動的化: `src/lib/seo/title.ts` の `makeTitle` と `src/lib/config/static.ts` のサイトメタミラーで、各ルートが `<title>` / `<meta name="description">` を上書き
- テスト: 新規 28 件 (Phase 4 で追加) — `buildTree` / `filterTree` の純関数テスト、`useTheme` の jsdom テスト、`ThemeToggle` / `TreeSidebar` のコンポーネントテスト、`static.ts` ドリフトガード、データレイヤースモークテスト
- ビルド: `npm run build` で `node:*` の externalize 警告ゼロ、CSS が `@layer` で適切に階層化されて出力

### 公開 API

`src/server/index.ts` から:

- `getNotesIndexData()` — `createServerFn` ラップ、`/notes` 一覧用の trimmed projection
- `getNoteDetailData({ data: { slug } })` — `createServerFn` + zod inputValidator、`/notes/$slug` 用 (`toc` / `incomingLinks` を含む)
- `getNotesTreeData()` — `createServerFn` ラップ、Notes セクション用の `TreeNode[]`
- 型: `NoteListItem`, `NoteDetail`

`src/lib/tree/buildTree.ts` から:

- `buildTree(notes)`, `buildTreeFromRenderedNotes(notes)` — フォルダ階層を持つ `TreeNode[]` を構築
- `findFolderAncestors(tree, slug)` — 指定 slug の祖先フォルダ id 配列を返す
- 型: `TreeNode`, `TreeFolderNode`, `TreeNoteNode`

`src/lib/tree/filterTree.ts` から:

- `filterTree(tree, query)` — 部分一致でフィルタしつつフォルダ祖先を温存

`src/lib/theme/` から:

- `useTheme()` — `{ preference, resolved, setPreference }` を返す。SSR セーフ
- `themeScript: string` — `<head>` インライン用の IIFE 文字列
- `STORAGE_KEY`, `Preference`, `nextPreference(current)`

`src/lib/seo/title.ts`:

- `makeTitle(pageTitle)` — `${pageTitle} | ${SITE_NAME}` を組み立て

`src/lib/config/static.ts`:

- `SITE_NAME`, `SITE_DESCRIPTION`, `SITE_URL`, `SITE_LOCALE`, `SITE_OG_IMAGE` — `site.config.ts` の手動ミラー (ドリフトはユニットテストで検出)

### 主要ファイル

```
vite.config.ts                                   # stylex.vite() を viteReact() の前に挿入、custom resolver
vitest.config.ts                                 # stylex プラグイン + viteReact、setupFiles
src/styles/tokens.stylex.ts                      # colors / space / radius / typography / shadow
src/styles/theme.stylex.ts                       # lightTheme / darkTheme + themeClasses export
src/styles/reset.css                             # @layer reset 配下
src/router.tsx                                   # reset.css を import
src/routes/__root.tsx                            # 動的 head + FOUC スクリプト
src/routes/index.tsx                             # AppShell variant="home"
src/routes/notes/route.tsx                       # /notes/* 親ルート、tree loader
src/routes/notes/index.tsx                       # AppShell variant="list" + NoteCard グリッド
src/routes/notes/$slug.tsx                       # AppShell variant="detail" + DetailLayout + RightSidebar
src/server/loaders.ts                            # createServerFn ラップ
src/lib/theme/{constants,useTheme,themeScript}.ts
src/lib/seo/title.ts
src/lib/config/static.ts
src/lib/tree/{buildTree,filterTree}.ts
src/components/layout/{AppShell,IconNav,TreeSidebar,DetailLayout,RightSidebar}.tsx
src/components/tree/{ContentTree,TreeSearch}.tsx
src/components/card/NoteCard.tsx
src/components/common/{ThemeToggle,Backlinks}.tsx
src/components/content/Toc.tsx
src/types/assets.d.ts                            # *.css モジュール宣言
tests/setup.ts                                   # jest-dom + RTL cleanup
tests/lib/tree/{buildTree,filterTree}.test.ts
tests/lib/theme/useTheme.test.ts
tests/lib/config/static.test.ts
tests/components/{ThemeToggle,TreeSidebar}.test.tsx
tests/server/loaders.test.ts
```

### 設計判断 (Phase 5 以降に影響)

1. **`createServerFn` の handler は inline 必須** — TanStack Start の vite プラグインは `.handler(async () => {…})` の引数を client バンドルでは RPC スタブに置き換える。ハンドラ本体を別関数として export してから `.handler(fetchFn)` のように渡すと client バンドルに本体が残り、`node:fs` 等が externalize 警告として再発する。テストは `getAllNotes` / `getNoteBySlug` 等の primitive を直接呼ぶ
2. **StyleX の `unstable_moduleResolution: 'custom'`** — 本プロジェクトは `verbatimModuleSyntax + allowImportingTsExtensions` で `.ts` 拡張子付き import を強制する。Node ESM の `import.meta.resolve` は `.ts` を解決しないため、ファイルシステム探索する custom resolver を `vite.config.ts` / `vitest.config.ts` の双方に置く
3. **Breakpoints はファイル内のフラットな string const** — レイアウトコンポーネントの先頭に `const BP_TABLET = "@media (min-width: 768px)"` のように宣言し、`{ [BP_TABLET]: ... }` で computed key として参照する。StyleX の `unstable_moduleResolution.type: "custom"` 下で `@media` 文字列を別ファイルから import すると `var(--hash)` の theme ref に変換され、`enableMediaQueryOrder` を迂回してソース順に同じプロパティが上書きされる (例: `default` の値がモバイルメディアクエリより後に書き出され、tablet 以上で base の値が残らない)。同ファイル内 const なら babel-stylex が値を静的にインライン化してくれて、衝突回避が機能する。`defineConsts` を使った専用ファイル (`breakpoints.stylex.ts`) も同じ問題を踏むので採用していない。なお `as const bp = { tablet: ... }` のオブジェクトでまとめると `[bp.tablet]` が `MemberExpression` になり `@stylexjs/eslint-plugin` の `valid-styles` が "All keys in a stylex object must be static literal values" でエラーを出す (plugin の `evaluate.js` は `Identifier` → variable lookup → `Literal` までしか辿らない)。フラット const なら `[BP_TABLET]` が単純な `Identifier` なのでこの evaluator で解決される
4. **ダークモード = `defineVars` の `@media` デフォルト + `createTheme` の override 二段構え** — システム追従 (OS) はトークンの `@media` で実現、明示選択 (light / dark) は `createTheme` の className を `<html>` に付与。FOUC スクリプトは `themeClasses.{light,dark}` を空白区切りで `classList.add` できないため、token を split してから個別追加
5. **ツリーの拡張状態は controlled** — `react-aria-components` の `<Tree expandedKeys={...} onExpandedChange={...}>` を controlled にして、アクティブ note の祖先展開と filter 入力時の自動展開を両立
6. **HEAD 動的化** — root route が site-wide のデフォルトを emit、leaf route が `head: ({ loaderData }) => …` で title / description を上書き。`makeTitle("Foo")` で `"Foo | Digital Garden"` を生成する
7. **Static config mirror** — `site.config.ts` を client から import すると `node:fs` 等を引きずるため、`src/lib/config/static.ts` で primitive を手動ミラー。`tests/lib/config/static.test.ts` がドリフトを検出
8. **Vitest 4 の環境振り分け** — `environmentMatchGlobs` は v4 で削除されたので、テストファイル冒頭の `// @vitest-environment jsdom` プラグマで代用
9. **RTL の auto-cleanup を明示有効化** — `tests/setup.ts` で `globalThis.document` 検査して `cleanup()` を `afterEach` で呼び出す。`globals: false` 構成では自動 cleanup が走らない
10. **CSS レイヤー順序** — `reset.css` で `@layer reset, base, components, utilities;` を宣言、StyleX は `useCSSLayers: true` で `@layer` 出力するため、リセットがコンポーネントスタイルより先に評価される

### Phase 4 で意図的に未実装

- Marginalia (脚注 / Callout) の左右配置、TOC アクティブハイライト (IntersectionObserver) — Phase 6
- Glossary / Books のルート・ツリー・カード — Phase 5 (IconNav には disabled プレースホルダで配置済み)
- 検索 (Pagefind)、RSS、sitemap、画像コピー — Phase 7
- デザインの最終形 (フォント、間隔、カラーパレットの調整) — Phase 8

## Phase 5 — Glossary / Books の対応 ✅

### 達成範囲

- 内部共通ヘルパー `collectContentItems<F>` と各 type の薄ラッパー (`collectNotes` / `collectGlossary` / `collectBooks`) を導入。Notes 既存挙動を温存しつつ Glossary / Books の収集を追加
- `validateGlossaryFrontmatter` / `validateBooksFrontmatter` を追加 (zod、`aliases` / `authors` 必須など)
- 内部共通レンダー `renderContentDrafts<F>` と type 別の `pickTitle` を導入 (`pickNotesTitle` / `pickGlossaryTitle` / `pickBooksTitle`)。`renderNotes` 既存シグネチャを保ったまま `renderGlossary` / `renderBooks` を追加
- `embed.ts` の Source ラベルを `pickContentTitle` (frontmatter のみで決まる cross-type タイトル) 経由に変更
- `ContentIndex` を `BaseFrontmatter` ジェネリックに広げ、Glossary の `term` / `aliases` と Books の `aliases` を `byName` に登録。type prefix `[[Notes/X]]` / `[[Glossary/X]]` / `[[Books/X]]` 経由の解決に加え、ファイル名・alias・term の横断ルックアップが動作。曖昧解決のエラーメッセージは 3 種の type prefix を提案
- `RenderedNoteDraft` を `RenderedItemDraft<F>` に汎用化 (`RenderedNoteDraft` は alias で残置)
- 五十音グルーピング純関数 `groupByFurigana(furigana?)` を `src/lib/glossary/` に追加 (あ行〜わ行 + その他、濁音・半濁音・拗音・カタカナ → ひらがなマップ、サロゲート対応)
- ツリー: `buildGlossaryTree` (五十音 folder + 子は furigana 昇順) / `buildBooksTree` (フラット、`pubYear` 降順、同値時は title locale ja)
- `ContentTree` / `TreeSidebar` / `TreeSearch` に `contentType` / `treeKind` / `placeholder` を追加。empty メッセージ・aria ラベル・href プレフィクスが treeKind 別に切り替わる
- サーバ層: `src/server/datasets.ts` で全 type を統合。`buildContentIndex` を 1 回構築し、3 種の `renderContentDrafts` を回した後 `buildBacklinks` を 1 度通すことで cross-type バックリンクを実現
- `src/server/notes.ts` を `datasets.ts` 委譲化。`__resetNotesCacheForTests` / `__setConfigForTests` 既存 export を維持しつつ、Glossary / Books 用の互換フックを `glossary.ts` / `books.ts` に追加
- `src/server/loaders.ts` に `getGlossaryIndexData` / `getGlossaryDetailData` / `getGlossaryTreeData` / `getBooksIndexData` / `getBookDetailData` / `getBooksTreeData` を追加 (handler は inline、zod inputValidator)
- ルート: `/glossary` / `/glossary/$slug` / `/books` / `/books/$isbn` を追加。Glossary index は五十音セクションごとの heading + jump-link、詳細は `GlossaryHeader` (term + furigana + aliases バッジ)、Books index は `auto-fill, minmax(220px, 1fr)` のカードグリッド、詳細は `BookHeader` (左コーナーに書影プレースホルダー + メタ縦並び、デスクトップ/モバイルでレスポンシブ)
- IconNav の Glossary / Books `disabled` プレースホルダを `<Link>` に置換、active 判定 (`onGlossary` / `onBooks`) を追加
- Backlinks に Glossary / Books 用の type 別 Link 分岐を追加 (`/glossary/$slug`、`/books/$isbn`)
- 既存 Notes ルート (`route.tsx` / `index.tsx` / `$slug.tsx`) の TreeSidebar 呼び出しに `treeKind="notes"` を追加
- Books の `cover` は Phase 5 では DTO に含めず、`BookCard` / `BookHeader` ともテキストプレースホルダー固定 (Phase 7 で復活予定)
- テスト 68 件追加 (107 → 175 件)、すべてグリーン。プリレンダー 18 ページ (Notes 6 + Glossary 5 + Books 4 + ルート 3)

### 公開 API (主な追加)

`src/lib/content/index.ts`:

- `collectGlossary(config) → ContentItem<GlossaryFrontmatter>[]`
- `collectBooks(config) → ContentItem<BooksFrontmatter>[]`
- `collectContentItems<F>(spec) → ContentItem<F>[]` (汎用ヘルパー)
- `validateGlossaryFrontmatter(raw, filePath)` / `validateBooksFrontmatter(raw, filePath)`
- `pickContentTitle(item)` (cross-type タイトル抽出)

`src/lib/markdown/index.ts`:

- `renderGlossary(items, config)` / `renderBooks(items, config)`
- `renderContentDrafts<F>(spec)` (内部用、`datasets.ts` から利用)
- `pickNotesTitle` / `pickGlossaryTitle` / `pickBooksTitle`

`src/lib/glossary/groupByFurigana.ts`:

- `groupByFurigana(furigana?)` / `FuriganaGroup` / `FURIGANA_GROUP_ORDER`

`src/lib/tree/`:

- `buildGlossaryTree(items)` / `buildBooksTree(items)` (Notes 用 `buildTree` は不変)

`src/server/`:

- `getSiteDataset()` (cross-type 統合データセット)
- `getAllGlossaryTerms` / `getGlossaryTermBySlug` / `getGlossaryGroupedIndex`
- `getAllBooks` / `getBookByIsbn`
- 6 種の loader server fn と DTO 型 (`GlossaryListItem` / `GlossaryDetail` / `GlossaryGroupSectionDto` / `BookListItem` / `BookDetail`)

### 主要ファイル

```
src/types/content.ts                              # RenderedGlossaryTerm / RenderedBook 型エイリアス
src/lib/content/title.ts                          # pickContentTitle
src/lib/content/collect.ts                        # collectContentItems<F> 追加
src/lib/content/validate.ts                       # Glossary / Books validator
src/lib/content/index.ts                          # 公開 API 拡張
src/lib/glossary/groupByFurigana.ts               # 五十音グルーピング純関数
src/lib/tree/buildGlossaryTree.ts                 # 五十音 folder ツリー
src/lib/tree/buildBooksTree.ts                    # フラットツリー (pubYear desc)
src/lib/linkgraph/resolve.ts                      # ContentIndex の cross-type 化
src/lib/linkgraph/graph.ts                        # RenderedItemDraft<F> 汎用化
src/lib/markdown/pipeline.ts                      # renderContentDrafts<F> + 3 種ラッパー
src/lib/markdown/plugins/embed.ts                 # pickContentTitle 経由化
src/server/datasets.ts                            # cross-type 統合 + memoize
src/server/notes.ts                               # datasets.ts へ委譲
src/server/glossary.ts / src/server/books.ts      # primitive アクセサ
src/server/loaders.ts                             # 6 つの新 createServerFn + DTO
src/components/layout/IconNav.tsx                 # Glossary / Books を Link に
src/components/layout/TreeSidebar.tsx             # treeKind prop
src/components/tree/ContentTree.tsx               # contentType prop で href 派生
src/components/tree/TreeSearch.tsx                # placeholder / aria-label prop
src/components/common/Backlinks.tsx               # type 別 Link 分岐
src/components/card/GlossaryItem.tsx              # 用語一覧カード
src/components/card/BookCard.tsx                  # 書籍一覧カード (cover プレースホルダー)
src/components/content/GlossaryHeader.tsx         # 用語詳細ヘッダー
src/components/content/BookHeader.tsx             # 書籍詳細ヘッダー (レスポンシブ書影プレースホルダー + メタ)
src/routes/glossary/{route,index,$slug}.tsx       # /glossary 系ルート
src/routes/books/{route,index,$isbn}.tsx          # /books 系ルート
tests/fixtures/vault/Glossary/*.md                # 4 件追加 (五十音複数行 + furigana なし + draft)
tests/fixtures/vault/Books/*.md                   # 2 件追加 (pubYear / read_date 持ち)
tests/lib/content/{title,glossary,books}.test.ts
tests/lib/markdown/{renderGlossary,renderBooks}.test.ts
tests/lib/glossary/groupByFurigana.test.ts
tests/lib/tree/{buildGlossaryTree,buildBooksTree}.test.ts
tests/server/{glossary,books}.test.ts
tests/components/{IconNav,Backlinks}.test.tsx
```

### 設計判断 (Phase 6 以降に影響)

1. **`buildContentIndex` は cross-type 共有が前提** — `datasets.ts` で全 type の items を結合してから 1 回だけ構築する。各 render 関数は `index` を引数で受け取り、内部で再構築しない (`renderNotes` 等のラッパーが単独で呼ばれた場合のみ Notes だけの index を組む)。新コンテンツタイプを追加するときも `datasets.ts` 1 箇所で完結する
2. **バックリンクは全 type を 1 回で逆引き** — `renderContentDrafts<F>` は `RenderedItemDraft<F>[]` を返し、`datasets.ts` で全 type の drafts を結合 → `buildBacklinks` → `attachBacklinks` を type 別に呼ぶ。これで Notes → Glossary や Glossary → Books の cross-type backlink が正しく出る
3. **`ContentIndex` の `byName` は slug + alias + term を同一ルックアップに通す** — 仕様書のリンク解決順序 (ファイル名 → aliases → term) を「同名候補が複数なら曖昧解決エラー」で吸収する。type prefix で書けば必ず解消できる
4. **Glossary 五十音グループは `TreeFolderNode` で表現** — 専用の TreeNode 種別は増やさず、`id: "group:あ行"` のフォルダノードに揃えることで `filterTree` / `findFolderAncestors` をそのまま流用できる
5. **`createServerFn` handler の inline 必須は維持** — grouping / DTO 整形は `src/server/glossary.ts` の primitive (`getGlossaryGroupedIndex` 等) に切り出し、loader はそれを呼ぶ薄い handler に保つ
6. **datasets の memoize リセットは 1 つ** — `__resetSiteDatasetForTests` が単一の真実点で、`__resetNotesCacheForTests` / `__resetGlossaryCacheForTests` / `__resetBooksCacheForTests` は同じ実装への薄ラッパー (テスト命名整合のため別名を提供)
7. **`cover` は Phase 5 では非表示** — DTO に含めず、`BookCard` / `BookHeader` ともテキストプレースホルダー。Phase 7 で `public/` への画像コピーを実装するときに DTO + 描画を復活させる
8. **TreeSidebar の `treeKind` は必須プロパティ** — Notes / Glossary / Books で aria ラベル・placeholder・empty メッセージ・href プレフィクスが切り替わる。`ContentTree` の `contentType` も同様で、`<TreeItem href={"/" + contentType + "/" + slug}>` で動的に組む (TanStack Router の type-safe `to` は使わない)
9. **同名 slug + alias の曖昧解決** — Notes に `react-fiber.md` があり、Glossary の別 item が `aliases: ["react-fiber"]` を持つと `BuildError`。仕様通りの正当な挙動 (テストで検証済み)
10. **StyleX の `@media` ネスト** — レスポンシブ条件は per-property 条件オブジェクトで書く (`{ default: ..., [BP_DESKTOP]: ... }`)。トップレベルキーとして `[BP_DESKTOP]: { ... }` を書くと `@stylexjs/valid-styles` が拒否する

### Phase 5 で意図的に未実装

- タグルート (`/notes/tags`、`/glossary/tags`、`/books/tags`) — 別 Phase で 3 type 横串で対応
- Marginalia (脚注 / Callout の左右配置)、TOC アクティブハイライト — Phase 6
- 書影 (`cover`) の `<img>` 描画と `public/` への画像コピー — Phase 7
- Pagefind、RSS、sitemap — Phase 7

## Phase 6 — Marginalia / 目次 / バックリンク ✅

### 達成範囲

- `NoteDetail` / `GlossaryDetail` / `BookDetail` に `footnotes: FootnoteEntry[]` と `callouts: CalloutEntry[]` を追加 (loaders.ts)。3 つの handler は inline の制約を維持
- 純関数 `computeMarginaliaPlacements` を `src/lib/marginalia/placements.ts` に追加。重なり対策 (gap 確保、入力の安定ソート) を `tests/lib/marginalia/placements.test.ts` で網羅 (5 件)
- 共通アイコン:
  - `ContentTypeIcon` (`src/components/common/ContentTypeIcon.tsx`) を新設、Notes / Glossary / Books の SVG を `IconNav` から流用しつつ Backlinks にも展開
  - `CalloutKindIcon` (`src/components/content/CalloutKindIcon.tsx`) で 5 種 (note / quote / tip / info / warning) を切り替え。Marginalia ヘッダで使用
- Marginalia コンポーネント (`src/components/content/Marginalia.tsx` + `MarginaliaItem.tsx`) を実装
  - クライアント側で `useEffect` + `requestAnimationFrame` + `ResizeObserver` + `MutationObserver` を組み合わせ、本文 ref 内のマーカー (`a[data-footnote-ref]` / `blockquote[data-callout]#callout-N`) の `getBoundingClientRect` を測定 → `computeMarginaliaPlacements` で重なり対策 → absolute 配置で side ごとに描画
  - footnote / callout を時系列順に並べ、index 偶数 → right, 奇数 → left の zigzag 配分。中サイズ (1024–1279px) では左 Marginalia を CSS で非表示にしているため自然と右のみが残る
  - SSR セーフ (`typeof window === "undefined"` ガード)
- `FootnoteSection` (`src/components/content/FootnoteSection.tsx`) を新設し、サーバ HTML で `<aside data-footnote-section>` + `<ol><li id="user-content-fn-${id}">` を出力。本文中の `<sup>` の `href="#user-content-fn-X"` がそのまま機能する。デスクトップでは CSS で非表示
- メディアクエリでの表示切替を `src/styles/content.css` (`@layer components`) に集約
  - `@media (>= 1024px)`: 本文中の `blockquote[data-callout]` と末尾 `[data-footnote-section]` を `display: none`
  - `@media (<= 1023px)`: `[data-marginalia-side]` を `display: none`
  - `@media (<= 1279px)`: `[data-marginalia-side="left"]` を `display: none`
  - モバイル時の inline callout の装飾 (種別ごとの背景色 + ボーダー + `::before` の Unicode アイコン)。色は tokens.stylex.ts の値を手書きでミラー (StyleX が emit する hashed CSS variable はプレーン CSS から参照不能なため。Phase 8 で見直し)
- `DetailLayout` を 3 段階の grid (`default` / `BP_DESKTOP` / `BP_DESKTOP_WIDE`) に拡張し、`leftMargin` / `rightMargin` ノードを slot として受け取れるように
- `DetailShell` に `footnotes` / `callouts` prop を追加し、本文 div に `data-content-body` を付与、Marginalia (left/right) と `FootnoteSection` をレイアウト内に配置。3 ルート (`notes/$slug` / `glossary/$slug` / `books/$isbn`) を更新
- `Toc` (`src/components/content/Toc.tsx`) を `useTocActive` フック (`useTocActive.ts`) と連携。IntersectionObserver の `rootMargin: "0px 0px -75% 0px"` で上端 25% に入った最深見出しを active にし、`aria-current="location"` + StyleX の accent スタイルでハイライト。CSS の `scroll-behavior: smooth` を `reset.css` に追加 (`prefers-reduced-motion: reduce` で auto)
- `Backlinks` (`src/components/common/Backlinks.tsx`) に `ContentTypeIcon` を 14px サイズで title の左に配置
- フィクスチャ追加: `tests/fixtures/vault/note-with-marginalia.md` (footnote 2 件 + 異なる種別の Callout、`private` マーカーで除外される Callout を含む)
- テスト 17 件追加 (175 → 192 件、すべてグリーン)
- ビルド: `VAULT_ROOT=$PWD/tests/fixtures/vault npm run build` で `node:*` 警告ゼロ、19 ページプリレンダー (Notes 5 + Glossary 4 + Books 3 + ルート 4 + ホーム 3 — 既存 18 + note-with-marginalia 1)

### 公開 API (主な追加)

`src/lib/marginalia/index.ts`:

- `computeMarginaliaPlacements(measurements, options?)` / `MarginaliaMeasurement` / `MarginaliaPlacement` / `ComputeMarginaliaOptions`

`src/components/`:

- `Marginalia` / `MarginaliaSide` (`content/Marginalia.tsx`)
- `MarginaliaFootnote` / `MarginaliaCallout` (`content/MarginaliaItem.tsx`)
- `FootnoteSection` (`content/FootnoteSection.tsx`)
- `CalloutKindIcon` (`content/CalloutKindIcon.tsx`)
- `useTocActive` (`content/useTocActive.ts`)
- `ContentTypeIcon` (`common/ContentTypeIcon.tsx`)

`src/server/loaders.ts` (DTO 拡張):

- `NoteDetail` / `GlossaryDetail` / `BookDetail` に `footnotes: FootnoteEntry[]` / `callouts: CalloutEntry[]` を追加

### 主要ファイル

```
src/lib/marginalia/placements.ts                # 純関数 (重なり対策)
src/lib/marginalia/index.ts                     # 公開 API
src/components/content/CalloutKindIcon.tsx
src/components/content/Marginalia.tsx           # クライアント計測 + 配置
src/components/content/MarginaliaItem.tsx       # footnote / callout 個別表示
src/components/content/FootnoteSection.tsx      # モバイル末尾セクション
src/components/content/Toc.tsx                  # active highlight 統合
src/components/content/useTocActive.ts          # IntersectionObserver hook
src/components/common/ContentTypeIcon.tsx       # IconNav + Backlinks 共有
src/components/common/Backlinks.tsx             # type icon 表示
src/components/layout/DetailLayout.tsx          # 3 段階 grid + margin slot
src/components/layout/DetailShell.tsx           # footnotes / callouts 受け取り、Marginalia + FootnoteSection 配置
src/components/layout/IconNav.tsx               # ContentTypeIcon に移行
src/server/loaders.ts                           # DTO に footnotes / callouts
src/styles/content.css                          # marginalia / inline callout / footnote section の表示切替
src/styles/reset.css                            # scroll-behavior: smooth
src/router.tsx                                  # content.css を import
src/routes/notes/$slug.tsx                      # DetailShell に渡す
src/routes/glossary/$slug.tsx
src/routes/books/$isbn.tsx
tests/fixtures/vault/note-with-marginalia.md    # フィクスチャ
tests/lib/marginalia/placements.test.ts
tests/components/CalloutKindIcon.test.tsx
tests/components/Toc.test.tsx
tests/components/Marginalia.test.tsx
tests/components/Backlinks.test.tsx             # type icon 検証を追加
tests/server/loaders.test.ts                    # DTO に footnotes / callouts smoke
tests/server/notes.test.ts                      # フィクスチャ追加に伴う期待値更新
```

### 設計判断 (Phase 7 以降に影響)

1. **Marginalia は SSR + クライアント計測のハイブリッド** — サーバ HTML は脚注末尾セクションも含めて完結 (no-JS / プリレンダー時点で読める)。デスクトップでは CSS でモバイル要素を hide、本文 ref 内のマーカー位置をクライアントで測ってマージナリアを absolute 配置する。SSR 描画後にハイドレートで Marginalia が現れる UX
2. **Marginalia の side 分配は zigzag (順番ベース)** — 全 footnote / callout を時系列順に並べ、index 偶数 → right、奇数 → left。1024–1279px では左を CSS で非表示にするので、結果的に右に集約される。Phase 8 で「全件右」「左右均等」など別ロジックに切り替えるなら `pickSide` のみ差し替えれば済む
3. **位置計算は純関数 (`computeMarginaliaPlacements`)** — 入力は `{ id, top, height }[]` (DOMRect 由来)、出力は `{ id, top }[]` (重なり解消済み)。jsdom + 単体テストで網羅、UI コンポーネントは「DOM 計測 → 純関数呼び出し → React state」のシン薄ラッパー
4. **DTO 拡張は 3 タイプとも対応** — Notes / Glossary / Books の DTO すべてに `footnotes` / `callouts` を載せた。Glossary / Books でもユーザーが Markdown を書いた時点で footnote / callout が現れうるため、`note-with-marginalia` の挙動を全タイプで継承する
5. **本文中 `[data-callout]` の表示切替は CSS の data-属性スコープ** — `dangerouslySetInnerHTML` で挿入される本文 HTML は StyleX のスコープ外なので、`src/styles/content.css` で `[data-content-body] blockquote[data-callout]` のような子孫セレクタを使う。本文 div に `data-content-body` 属性を付ければ scoped に保てる
6. **CSS 変数の StyleX 連携問題** — StyleX の `defineVars` は hashed name の CSS variable を emit する (`--xK0aB_calloutNoteBg` のような)。プレーン CSS からは参照名が安定しないため、`content.css` のインライン callout 装飾は token と同じ HEX 値を二重定義している (Phase 8 で `:root` に名前付き variable を別途流すか、CSS-in-JS でやり直す)
7. **`useTocActive` の rootMargin** — `"0px 0px -75% 0px"` で「ビューポート上端から 25% に入った見出し」を active 候補にし、複数ある場合は最後 (= 最深) を選ぶ。スムーズスクロール中も自然に追従する
8. **`DetailLayout` を 3 段階レスポンシブに拡張** — `default` / `BP_DESKTOP` (1024px = main + right) / `BP_DESKTOP_WIDE` (1280px = left + main + right) の 3 段階 grid。Phase 4 では 2 段階 (default / wide) だったので、中サイズで右 Marginalia を出すために 1024px の中段を追加
9. **インラインスタイルの限定許可** — Marginalia 各アイテムの `top: <px>` は実行時計算なので StyleX で表現できず、`useMemo({ top: ... })` で安定参照を作りインライン `style` に渡す。これは Phase 4 の「インラインスタイル原則禁止」例外として、コメントで理由を明記
10. **ContentTypeIcon の抽出は IconNav を巻き込む小さなリファクタ** — IconNav 内で重複していた SVG path を共通コンポーネント化。Backlinks の type 別アイコン要件と合わせて、3 タイプ表現の単一ソース化を実現

### Phase 6 で意図的に未実装

- 検索 (Pagefind)、RSS、sitemap、画像コピー / 書影 (`cover`) の `<img>` 描画 — Phase 7
- タグルート (`/notes/tags` / `/glossary/tags` / `/books/tags`) — 別 Phase で 3 タイプ横串
- StyleX の hashed CSS variable と `content.css` の color 重複定義の解消、フォント / 間隔 / カラーパレットの最終調整 — Phase 8

## Phase 7 — 検索 / RSS / sitemap / 画像 / デプロイ ✅

### 達成範囲

- 画像処理パイプラインを Phase 2 の `RenderedItem.images` を起点に追加。`src/lib/images/` に純関数 (`buildImageMapping` / `rewriteImgSrcInHtml` / `bookCoverToImageRef` / `lookupBookCoverUrl`) を実装。basename 衝突時のみ sha1 8 文字をサフィックスとして付与。外部 URL (`http(s):` / `data:`) はコピーも書換もしない
- `SiteDataset` に `imageMapping: ImageMappingEntry[]` と `coverBySlug: Map<bookSlug, publicPath>` を載せ、`getSiteDataset()` 一回で全成果物が出るよう拡張。`getBookCoverMap()` プリミティブを `src/server/books.ts` に追加し、loaders で `BookListItem.coverUrl` / `BookDetail.coverUrl` を返すように
- `BookCard` / `BookHeader` を `coverUrl !== null` で `<img>` 描画、`null` のときは Phase 5 のテキストプレースホルダーを継続。aspect-ratio 3/4、`object-fit: cover`、`loading="lazy"`、`alt=""`
- `scripts/post-build.ts` (`tsx` で `postbuild` npm hook) を追加。`loadConfig()` で `VAULT_ROOT` を honor し、`__setSiteDatasetConfigForTests` で新規 build を強制してから:
  1. `dist/client/images/` に画像コピー (欠損は `image-reference` 相当のエラー)
  2. `dist/client/notes|glossary|books/$slug/index.html` を per-item mapping (rawPath → publicPath) で書換
  3. `dist/client/sitemap.xml` を `buildSitemapEntries` + `renderSitemapXml` で生成
  4. `dist/client/feed.xml` (Atom 1.0) を `buildAtomEntries` + `renderAtomXml` で生成。`SITE_LOCALE` を `xml:lang` に注入
  5. `npx pagefind --site dist/client` を子プロセスで実行し `dist/client/pagefind/` を生成
- Atom feed は Notes / Glossary / Books 横断、`updated` 降順、`FEED_MAX_ITEMS = 20` 件。`extractFeedSummary` で frontmatter.summary を優先、なければ html を strip + whitespace 正規化 + 200 grapheme で truncate (`…` を付加)
- sitemap は 4 ルート (`/`, `/notes`, `/glossary`, `/books`) + 各 detail。`lastmod` は frontmatter.updated を持つときのみ。非 ASCII slug は `encodeURIComponent`
- `src/lib/search/` に Pagefind UI オプション (`makePagefindUIOptions`) と `/` キーショートカット (`bindSlashShortcut`、テキスト input 内では発火しない) を実装。`SearchIcon` + `SearchDialog` (react-aria `ModalOverlay` + `Modal` + `Dialog`) を `IconNav` 先頭に組み込み。`pagefind-ui.js` は初回 open 時に `await import(URL)` で遅延ロード、`pagefind-ui.css` は `<link rel="stylesheet">` を `<head>` に一度だけ注入
- `DetailShell` の本文 div に `data-pagefind-body` を追加 → Pagefind がインデックス対象を本文に限定 (12 detail ページ / 113 単語)
- `__root.tsx` の HEAD に `<link rel="alternate" type="application/atom+xml" href={SITE_URL + "/feed.xml"}>` と `<link rel="sitemap">` を追加
- `wrangler.jsonc` を新設 (`assets.directory=./dist/client`, `not_found_handling=404-page`)、`npm run deploy` / `deploy:dry` / `deploy:preview` を `package.json` に追加。`@cloudflare/vite-plugin` / Worker entry は導入しない (フル SSG)
- `FEED_MAX_ITEMS` を `src/lib/config/static.ts` に追加、drift-guard テストを拡張
- フィクスチャ: `tests/fixtures/vault/_assets/sample-cover.png` (1×1 PNG、約 70 B、git に commit) を追加し `Books/9784873119045.md` の frontmatter に `cover: /_assets/sample-cover.png` を設定
- テスト 50 件追加 (220 → 270 件、全グリーン)。画像 path mapping / HTML rewrite / cover resolve / Atom / sitemap / summary / URL ヘルパー / slash shortcut / SearchDialog (Pagefind UI mock) / IconNav search button / BookCard / BookHeader / static drift / books cover

### 公開 API (主な追加)

`src/lib/images/index.ts`:

- `buildImageMapping(refs) → { entries, conflicts }`、`buildResolvedToPublicMap(entries)`、`hashSuffix(path)`、`isExternalImagePath(value)`
- `rewriteImgSrcInHtml(html, rawToPublic)`
- `bookCoverToImageRef(ctx)`、`lookupBookCoverUrl(ctx, resolvedToPublic)`
- 型: `ImageMappingEntry`、`ImageMappingResult`、`BookCoverContext`

`src/lib/feed/index.ts`:

- `extractFeedSummary(item, maxLength?)`、`stripHtmlTags(html)`、`DEFAULT_SUMMARY_LENGTH`
- `buildSitemapEntries(input, siteUrl)`、`renderSitemapXml(entries)`
- `buildAtomEntries(input, siteUrl, maxItems)`、`renderAtomXml(site, entries)`
- `joinSiteUrl(siteUrl, path)`、`escapeXml(value)`
- 型: `SitemapEntry`、`SitemapInput`、`FeedEntry`、`FeedInput`、`FeedSiteInfo`

`src/lib/search/index.ts`:

- `PAGEFIND_BUNDLE_PATH`、`PAGEFIND_CSS_HREF`、`makePagefindUIOptions(element)`
- `bindSlashShortcut(onOpen) → () => void`、`isSlashShortcutTarget(target)`

`src/lib/config/static.ts`:

- `FEED_MAX_ITEMS = 20`

`src/server/`:

- `SiteDataset.imageMapping`、`SiteDataset.coverBySlug` を追加
- `getBookCoverMap()`
- `BookListItem.coverUrl: string | null`、`BookDetail.coverUrl: string | null`

### 主要ファイル

```
src/lib/images/{resolve,rewrite,cover,index}.ts
src/lib/feed/{atom,sitemap,summary,url,index}.ts
src/lib/search/{pagefindOptions,slashShortcut,index}.ts
src/components/common/{SearchIcon,SearchDialog}.tsx
src/components/card/BookCard.tsx                # <img> 描画
src/components/content/BookHeader.tsx           # <img> 描画
src/components/layout/IconNav.tsx               # search button + dialog
src/components/layout/DetailShell.tsx           # data-pagefind-body
src/server/datasets.ts                          # imageMapping / coverBySlug
src/server/books.ts                             # getBookCoverMap
src/server/loaders.ts                           # coverUrl 追加
src/lib/config/static.ts                        # FEED_MAX_ITEMS
src/routes/__root.tsx                           # <link rel="alternate" / "sitemap">
scripts/post-build.ts                           # images / sitemap / feed / pagefind 順
wrangler.jsonc                                  # Static Assets only
tests/fixtures/vault/_assets/sample-cover.png   # 1x1 PNG fixture
tests/lib/images/{resolve,rewrite,cover}.test.ts
tests/lib/feed/{atom,sitemap,summary,url}.test.ts
tests/lib/search/slashShortcut.test.ts
tests/components/{BookCard,BookHeader,SearchDialog}.test.tsx
tests/components/IconNav.test.tsx               # search button assertions
tests/server/books.test.ts                      # getBookCoverMap
tests/lib/config/static.test.ts                 # FEED_MAX_ITEMS drift
```

### 設計判断 (Phase 8 以降に影響)

1. **画像コピーは post-build スクリプト + per-item HTML 書換** — Phase 2 の Markdown パイプラインを変更せず、`scripts/post-build.ts` が `dist/client/` を読んで書き戻すだけ。HTML 内の `<img src>` 曖昧性 (同じ rawPath が別の resolvedAbsolutePath に解決されるケース) を per-RenderedItem mapping で解消。Vite の build 経路を汚さない一方、`npm run dev` 中の `<img>` は Vault 絶対パスのまま (Phase 8 で dev middleware を検討)
2. **画像 publicPath は basename フラット + 衝突時のみ sha1 8 文字付与** — `/images/<basename>.<ext>` が大半、`/images/<stem>-<hash>.<ext>` が衝突時のみ。Vault 内ディレクトリ構造を URL に出さない方針 (将来 Vault を再編しても URL が安定)
3. **書影は `ImageRef` として `images` に混ぜず別経路で resolve** — `applyImage` (Markdown 経由) を通さない `BooksFrontmatter.cover` 専用の `bookCoverToImageRef` を作り、buildImageMapping の入力に追加。`coverBySlug` は `SiteDataset` に持たせる
4. **Atom 1.0 採用、全 3 type 横断、20 件** — frontmatter の YAML 日付が ISO 8601 と相性が良く、`<id>` / `<link rel="self">` / `xml:lang` を含められる。仕様 (build-spec.md「Notes のみ」) ではなくユーザー指示 (3 type 横断) を採用
5. **`<summary>` は frontmatter.summary 優先 → 本文 200 grapheme 切り出し** — `Array.from(string)` でサロゲートペアと絵文字を 1 grapheme として数える。`length` ベースだとサロゲート分割で `…` 前後が破綻する
6. **Pagefind は CLI (`npx pagefind`) を子プロセスで起動** — Node API より破壊的変更が少なく、`data-pagefind-body` スコープ指定が自然に効く。`spawn(..., { stdio: "inherit" })` でログを通過
7. **Pagefind UI は `import(URL)` で遅延ロード、CSS は `<link>` で一度だけ注入** — 初回 `/` 押下まで読み込まれない。`pagefindModulePromise` をモジュールスコープで singleton 化、stylesheet は DOM 上の存在を毎回 query して重複注入を回避 (`pagefindCssInjected` フラグは外した、テストでの再 mount に耐える)
8. **Cloudflare Workers は Static Assets のみ** — `wrangler.jsonc` 最小構成 (`assets.directory` + `not_found_handling`)、Worker entry を書かない。`@cloudflare/vite-plugin` は導入せず、Vite と wrangler のライフサイクルは独立。`deploy:preview` (`wrangler dev`) でローカル検証用
9. **`createServerFn` handler の inline 制約は維持** — `BookListItem.coverUrl` / `BookDetail.coverUrl` 追加でも handler 内で `getBookCoverMap()` を呼ぶ薄いラッパー構成に留め、Phase 4〜6 の制約を継承
10. **画像存在検証は post-build 内で完結** — `BuildError` (`image-reference`) を post-build スクリプトが console.error + `throw` で再現 (Markdown レンダー時の検証はしない、Vault 内に存在しなくても build は通り、post-build で初めて落ちる)。差分ビルド導入時に検証段階の再配置を検討

### Phase 7 で意図的に未実装

- 画像最適化 (WebP / 複数解像度 / `<picture>`) — Phase 8 以降
- 動的 OGP 画像生成 — Phase 8 以降
- 差分ビルド (ハッシュ計算ベース) — 将来課題
- タグルート (`/notes/tags` / `/glossary/tags` / `/books/tags`) — 別 Phase
- StyleX-emitted CSS variable と `content.css` の HEX 値重複定義の解消 — Phase 8
- フォント / カラーパレット / 間隔の最終調整 — Phase 8
- `npm run dev` 中の `<img>` を Vault から提供する dev middleware — Phase 8 で検討

## Phase 8 — デザインの作り込みと style cleanup ✅

### 達成範囲

- StyleX-emitted hashed CSS variable と raw CSS (`content.css`) の HEX 二重定義を解消。新規 3 ファイル `src/styles/{callout,code,font}-vars.css` に `:root` (light) と `[data-theme-resolved="dark"]` (dark) の名前付き変数を流し、`tokens.stylex.ts` と `theme.stylex.ts` のエントリを `"var(--callout-*)"` / `"var(--code-*)"` / `"var(--font-*)"` の参照に書き換えた。`theme.stylex.ts` の `createTheme` から callout・code 関連の override を全削除 (CSS var が theme を切り替えるので不要)
- `fontSans` / `fontMono` / `fontSerif` の適用範囲を確定。`content.css` の `[data-content-body]` 配下で `h1–h6` に `var(--font-serif)`、`code` / `pre` / `kbd` / `samp` に `var(--font-mono)` を適用。UI chrome (IconNav / Tree / Card / 一覧ページの heading) は `AppShell` の `fontSans` 継承を維持
- ContentTree の indent `calc()` をハードコードの `0.75rem` / `0.25rem` から `${space.s3}` / `${space.s1}` 参照に置換 (spacing スケールが single source of truth)
- DetailShell の tag リストに `marginBottom: space.s4` を追加 (タグと本文の間隔が tight すぎた問題を解消)
- WCAG 2.2 SC 1.4.11 (3:1) を満たすため callout 4 種 (quote / tip / info / warning) の border 色を darken。検証スクリプト `scripts/check-contrast.ts` を新設し、AA 必須ペアを `npx tsx scripts/check-contrast.ts` で再測定可能にした
- code 周りを実際に配線。Phase 7 まで `tokens.codeBg` / `codeBorder` は token 定義のみで未使用、Shiki は `defaultColor: false` で `--shiki-light` / `--shiki-dark` を CSS 変数として吐くだけでマッピングなしの状態だった。`content.css` で `pre` を `--code-bg` + `--code-border` + padding + radius でフレーム化、`pre code (span)` の `color` を `var(--shiki-light)` / `var(--shiki-dark)` にマッピング、`(not pre) > code` には subtle bg を当てた
- Pagefind UI が `:root` で固定の light 配色 (#393939 text on #ffffff) を強制してくる問題を、`src/lib/search/pagefind-overrides.css` で `.pagefind-ui` (より specific) を経由して上書き。`[data-theme-resolved="dark"]` で dark テーマ値に切替、`<mark>` (検索ハイライト) を `colors.selection` 相当の swatch に置換。SearchDialog.tsx から `import` してチャンクに同梱
- SearchDialog の overlay / dialog padding を `clamp(space.s_, vw, space.s_)` 化。固定 `space.s4` だった padding がモバイル/デスクトップで滑らかにスケールするように
- 全 commit ごとに `typecheck` / `lint` / `test` (270 件全 green 維持) / `VAULT_ROOT=tests/fixtures/vault build` / `deploy:dry` で検証

### 公開 API (主な追加)

`src/styles/`:

- `callout-vars.css`、`code-vars.css`、`font-vars.css` — `:root` と `[data-theme-resolved="dark"]` で `--callout-*` / `--code-*` / `--font-*` を宣言。命名規則は `--{group}-{role}` (`--callout-note-bg`、`--code-border`、`--font-mono` 等)。raw CSS と StyleX tokens の双方の source of truth
- `tokens.stylex.ts` の callout / code / font 関連トークンは `"var(--...)"` 文字列に統一。`theme.stylex.ts` の `lightTheme` / `darkTheme` から callout / code エントリを削除 (`createTheme` は partial を受け付ける)

`src/lib/search/`:

- `pagefind-overrides.css` — `.pagefind-ui` を経由した Pagefind UI 配色 override。`[data-theme-resolved="dark"]` で dark テーマに連動

`scripts/`:

- `check-contrast.ts` — WCAG 2.x 相対輝度とコントラスト比を sRGB から純関数で算出。`light` / `dark` 各テーマで本文・リンク・focus ring・code・callout の必須ペアを assert。失敗時 exit 1。再実行コマンドは `npx tsx scripts/check-contrast.ts`

### 主要ファイル

```
src/styles/callout-vars.css            # 新規 — callout 色の named CSS var
src/styles/code-vars.css               # 新規 — code 色の named CSS var
src/styles/font-vars.css               # 新規 — font-family の named CSS var
src/styles/tokens.stylex.ts            # callout/code/font tokens → var(--...) 参照
src/styles/theme.stylex.ts             # callout/code override を削除
src/styles/content.css                 # callout HEX 撤去、h1-h6 serif、pre/code/Shiki 配線
src/router.tsx                         # callout-vars / code-vars / font-vars の import 追加
src/components/tree/ContentTree.tsx    # indent calc を space.s* 参照に
src/components/layout/DetailShell.tsx  # tags marginBottom 追加
src/components/common/SearchDialog.tsx # overlay/dialog padding を clamp() 化、override CSS import
src/lib/search/pagefind-overrides.css  # 新規 — Pagefind UI 配色 override
scripts/check-contrast.ts              # 新規 — WCAG AA 検証
```

### 設計判断 (Phase 9 以降に影響)

1. **二重定義は名前付き CSS variable で解消** — 検討した 3 案 ((a) named var / (b) callout を StyleX 化 / (c) build step で hash 再公開) のうち (a) を採用。最小工数で source of truth を 1 箇所にでき、StyleX 側も `"var(--...)"` を default 値として `defineVars` に置けば従来 API を破壊しない。callout だけでなく code・font にも同パターンを拡張した
2. **dark mode 切替は `[data-theme-resolved="dark"]` を中心化** — `useTheme.ts` / `themeScript.ts` が `<html>` に attribute を立てる既存仕様 (Phase 4 から) を活用。CSS var の override は同 selector で記述し、StyleX `themeClasses` (createTheme) は callout/code を持たなくなった
3. **font 適用は content.css で selector-based、StyleX 経由ではない** — body 本文 (`[data-content-body]`) の HTML は `dangerouslySetInnerHTML` で挿入されるため React コンポーネントで包めない。`content.css` の `[data-content-body] :is(h1..h6)` 等で適用するのが最少手数
4. **`fontSerif` は本文 heading のみに適用** — Hiragino Mincho ProN は和文サイドが明確に異なるので UI 用と分離。一覧 card / IconNav / Tree は `fontSans` を維持し、editorial と navigation の視覚区別を作った
5. **WCAG 検証は自前スクリプトで純関数化** — `@axe-core` 等は導入せず、sRGB → 相対輝度 → コントラスト比を `scripts/check-contrast.ts` 内に inline。失敗時 `process.exitCode = 1` で CI からも assert 可能。今後 token を増減したら同スクリプトの `Token[]` を更新する
6. **callout border は light/dark 共通で AA 通過** — オリジナルは dark 主導で light が AA 未達だった。light で 3:1 を満たす mid-tone を選び直すと dark でも 4.3–5.4:1 を維持できたので、テーマごとに border を split せず単一値で済ませた (`callout-vars.css` 内 dark override は bg のみ)
7. **Shiki は upstream の `--shiki-light/dark` を CSS で `color` に流すだけ** — `defaultColor: false` を維持。React 側からテーマを知らせる必要がなく、`[data-theme-resolved="dark"]` のグローバル切替で全 code block が連動する
8. **Pagefind 上書きは `.pagefind-ui` selector 経由 (上書き先 token は変更しない)** — upstream の `:root` 設定よりも specificity が高いため CSS 読み込み順に関係なく勝つ。CSS は `SearchDialog.tsx` から `import` し、Pagefind UI JS と同じチャンクに含めて初回 search dialog open まで cost を遅延
9. **SearchDialog の padding は `clamp(space.s_, vw, space.s_)`** — flat string CSS expression を StyleX に渡すパターン。breakpoint media query を増やさず viewport 連動の余白を実現
10. **Marginalia zigzag は維持** — `pickSide(index)` の偶奇ロジックを `BP_DESKTOP_WIDE` 以上で継続使用。Phase 8 では別ロジック (全件右 / type 別) への切替は見送り、Phase 9 で UX フィードバックを基に再検討

### Phase 8 で意図的に未実装

- `npm run dev` 中の `/images/...` を Vault に向ける Vite middleware — Phase 9
- 画像最適化 (WebP / `<picture>` / srcset) と動的 OGP 画像生成 — 別 Phase で独立タスク化
- タグルート (`/notes/tags` / `/glossary/tags` / `/books/tags`) — 3 type 横串で別 Phase
- Vault watch モード / 差分ビルド — 将来課題

## Phase 9 (引き継ぎメモ)

### 想定スコープ

- `npm run dev` 中の `/images/...` を Vault から提供する Vite middleware
  - `src/lib/images/resolve.ts` の `buildImageMapping` を `configureServer` フックで dev server 起動時に評価して `resolvedToPublic` Map を作り、Vite middleware で `/images/<path>` リクエストを `fs.createReadStream(resolvedAbsolutePath)` で返す
  - Vault 変更検知 (watch) は依然として将来課題
- 画像最適化パイプライン
  - WebP 変換、複数解像度生成、`<picture>` + `srcset` への HTML 書換
  - `scripts/post-build.ts` を拡張するか、別スクリプト/プラグインに切り出すか要検討
- 動的 OGP 画像生成
  - 詳細ページごとに social card を SVG → PNG / WebP で生成
  - `@cloudflare/workers-types` 経由で Worker 化するか、static 事前生成にとどめるか
- タグルート (`/notes/tags`、`/glossary/tags`、`/books/tags`) 横串展開
- デザイン UX フィードバックに基づく Marginalia 配置ロジック再評価 (現状 zigzag を維持)

### 既存資産

- 名前付き CSS var パターン (`src/styles/{callout,code,font}-vars.css` + `var(--...)` 参照) — Pagefind override で実証済み。Phase 9 で他の third-party UI を組み込む際は同パターンを再利用できる
- `scripts/check-contrast.ts` — palette 調整時に `Token[]` を更新して再実行するだけで AA 検証可能。新規 callout や theme を増やすときは pairs 関数に追記
- Shiki マッピング (`content.css` の `pre code, pre code span { color: var(--shiki-light) }`) — 他のテーマを増やす場合 `cssVariablePrefix` と CSS 側を揃える
- `pagefind-overrides.css` の `.pagefind-ui` selector + `[data-theme-resolved="dark"]` パターン — 別の third-party UI (例: コメントウィジェット) を後で組み込むときの参考

### ツールチェーン追従メモ (2026-05)

Phase 9 着手前に環境を `npm run dev` で改めて起動して判明した、Phase 8 までは表面化していなかった非互換と回避策。`npm run build && npm run preview` ベースで作業すると見落とすので注意。

- **TanStack Start v1.169 系では standalone `tanstackRouter` を併用しない** — `vite.config.ts` に `tanstackRouter` と `tanstackStart` の両方を登録すると code-splitting transform がすり抜けて、初回リクエストで `TSRSplitComponent is not defined` の 500 が出る。`tanstackStart` だけを使えば router-plugin が内部で適用される。`autoCodeSplitting` は `@tanstack/start-plugin-core/schema.ts` が `.omit({ autoCodeSplitting: true, target: true })` しており、ユーザー入力からは渡せない (内部で管理される)。Phase 4 で書いた `vite.config.ts` のプラグイン構成からこの 1 行を取り除く形で対応した
- **`@stylexjs/unplugin` の dev CSS link は SSR 環境では手動注入する** — `unplugin` は Vite の `transformIndexHtml` フックで `<link rel="stylesheet" href="/virtual:stylex.css">` と `<script src="/@id/virtual:stylex:runtime">` を head に注入するが、`tanstackStart` の SSR pipeline は transformIndexHtml 結果から `<script>` のみ抽出するため link 側が落ち、StyleX が生成する hashed クラスに対応する CSS が一切配信されない。本番ビルドでは `generateBundle` で CSS が asset に統合されるため問題は出ない。dev 専用対処として `src/routes/__root.tsx` の `<head>` 内で `import.meta.env.DEV` を見て手動で `<link>` を出している
- **`<html>` には `suppressHydrationWarning` を付ける** — `__root.tsx` 先頭で `themeScript` を実行して `<html>` の `data-theme` / `data-theme-resolved` / `color-scheme` を書き換える設計上、サーバー HTML とクライアント DOM が必ず食い違う。React の警告を抑止するため `<html>` に `suppressHydrationWarning` を付与している。直下属性だけ抑制されるので body 配下の hydration mismatch は引き続き検出される
- **YAML 空フィールドは null になる** — `summary:` のように値が無いフィールドは parser が `null` として返す。Zod の `.optional()` は `undefined` しか許容しないため、parse 前に top-level の null エントリを undefined 相当へ落とす `stripNulls()` を `src/lib/content/validate.ts` に追加した。`summary` だけでなく `tags` / `featured` / `created` / `updated` などあらゆる optional フィールドで同じ問題が起こり得る (Obsidian Vault では空フィールドが残りがち) ので、フィールド単位ではなく入り口で前処理する方針
- **dev と preview の検証乖離** — Phase 7 / 8 までの目視確認は `npm run preview` 中心で、`npm run dev` 経路で初めて顕在化する不具合 (上記 3 つ全部含む) が見過ごされていた。Phase 9 以降は機能追加時に **dev / preview 両方** で表示確認するのが安全

## ログ更新ルール

- フェーズ完了時にこのファイルを更新する (達成範囲・公開 API・主要ファイル・設計判断)
- 次フェーズの「引き継ぎメモ」も同タイミングで更新する
- 完了済みフェーズの「引き継ぎメモ」は履歴として残してよいが、必要に応じて簡略化する
