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

## Phase 5 — Glossary / Books (引き継ぎメモ)

### 想定スコープ

- Vault 内 `Glossary/` 配下の収集パイプライン (`collectGlossary` 等)、五十音インデックス、`furigana` ベースのソート
- Vault 内 `Books/` 配下の収集パイプライン、ISBN slug、`aliases[0]` をメインタイトルとする運用
- ルート: `/glossary`, `/glossary/$slug`, `/books`, `/books/$isbn`
- IconNav の Glossary / Books ボタンを `disabled` から `<Link>` に切り替え
- TreeSidebar のコンテキスト切り替え: コンテンツタイプに応じてツリーの構造とラベルを変える (Notes はサブフォルダ、Glossary は五十音グルーピング、Books はフラット)
- Glossary 詳細ページのレイアウト (用語名 + furigana + 本文 + 関連語)
- Books 詳細ページ (書影 + メタデータ + 感想本文)
- BookCard / GlossaryItem コンポーネント

### 推奨アプローチ

- `src/lib/content/` の `collectNotes` を一般化して `collectGlossary` / `collectBooks` を追加。frontmatter スキーマは `src/types/content.ts` に既に存在 (`GlossaryFrontmatter` / `BooksFrontmatter`)
- `src/server/loaders.ts` に `getGlossaryIndexData` / `getGlossaryDetailData` / `getBooksIndexData` / `getBookDetailData` / `getGlossaryTreeData` / `getBooksTreeData` を追加 (handler は必ず inline)
- TreeSidebar に `treeKind: "notes" | "glossary" | "books"` プロパティを足し、`buildTree` をコンテンツタイプ別に派生
- 五十音グルーピングは `furigana` の頭文字を `あかさたなはまやらわ行` のいずれかにマップする純関数 (`src/lib/glossary/groupByFurigana.ts`) として実装
- ISBN slug は `src/lib/content/slug.ts` を拡張するか、Books 専用の slug deriver を追加
- IconNav の disabled ボタンを `<Link to="/glossary" />` / `<Link to="/books" />` に置き換え

### 着手前の確認

- `docs/content-spec.md` の Glossary / Books 仕様 (frontmatter、URL 構造、タグ名前空間)
- `docs/ui-spec.md` の「Glossary」「Books」セクション
- 五十音インデックスの仕様 (どの行に分けるか、未指定 furigana の扱い)

## Phase 6 〜 8 (概要のみ)

| Phase | 主な作業                                                                 | 主要参照                                              |
| ----- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| 6     | Marginalia 配置、TOC ハイライト (IntersectionObserver)、バックリンク表示 | `docs/ui-spec.md`「Marginalia」「右サイドバー」       |
| 7     | Pagefind、RSS、sitemap、画像コピー                                       | `docs/build-spec.md`「サイトマップ・RSS」「画像処理」 |
| 8     | デザイントークン詰め、ダークモード、レスポンシブ調整                     | `docs/ui-spec.md`「ダークモード」「レスポンシブ」     |

差分ビルド・画像最適化・動的 OGP は本ロードマップ外 (将来課題)。

## ログ更新ルール

- フェーズ完了時にこのファイルを更新する (達成範囲・公開 API・主要ファイル・設計判断)
- 次フェーズの「引き継ぎメモ」も同タイミングで更新する
- 完了済みフェーズの「引き継ぎメモ」は履歴として残してよいが、必要に応じて簡略化する
