# 実装ログ

各フェーズの完了状況、主要 API、設計判断、次フェーズへの引き継ぎメモを記録する。
別チャット / 別セッションへ作業を引き継ぐための一次ソース。

段階分けは `CLAUDE.md` の「段階的な実装方針」に対応する。

## サマリ

| Phase | 内容                                    | 状態           | 完了日     |
| ----- | --------------------------------------- | -------------- | ---------- |
| 1     | コンテンツ収集とパース (Notes 最小構成) | ✅ Done        | 2026-05-09 |
| 2     | Markdown 変換とリンク解決 (Notes 限定)  | ✅ Done        | 2026-05-09 |
| 3     | 基本的なルーティング (Notes 詳細・一覧) | ⏳ Not started | —          |
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

## Phase 3 — 基本的なルーティング (引き継ぎメモ)

### 想定スコープ

- TanStack Start を SSG モードで導入 (`docs/architecture.md`「TanStack Start」)
- ファイルベースルーティング:
  - `/` (トップ) — 一旦プレースホルダで OK
  - `/notes` — Notes 一覧 (`updated` 降順、ページネーションは初期段階では不要)
  - `/notes/$slug` — Notes 詳細 (`RenderedNote.html` を流し込む)
- ビルドコマンド (`npm run dev` / `npm run build` / `npm run preview`) のスクリプト化 (`docs/build-spec.md`「ビルドコマンド」)
- ビルドパイプライン: `loadConfig` → `collectNotes` → `renderNotes` → SSG ルート出力 (`docs/build-spec.md`「ビルドパイプライン」)
- Cloudflare Workers の Static Assets 想定で `dist/` に出力する設定 (実デプロイは Phase 7 以降)

### 推奨アプローチ

- **データ供給は静的に** — `collectNotes` + `renderNotes` の結果をビルド時にルートのローダーに流す。TanStack Start の `loader` か `defineConfig` の SSG オプションを使う
- **詳細ページの DOM 出力** — Phase 2 が出した `html` 文字列を `dangerouslySetInnerHTML` で流し込む。Marginalia / TOC / バックリンクの DOM 化は Phase 4 以降に分割
- **ルーティングのテスト** — TanStack Start の SSG 出力 (`dist/`) を生成し、`/notes/<slug>/index.html` 等が期待通り存在することを確認する E2E テスト相当を 1 件入れる
- **ファイル名と URL** — `docs/content-spec.md`「URL 構造」に従い、トレイリングスラッシュなし、Notes のサブフォルダはフラット化
- React / react-aria-components / StyleX は Phase 4 で本格導入。Phase 3 はプレーンな React + 最小限の CSS リセットのみで OK

### 着手前の確認

- `docs/build-spec.md`「ビルドパイプライン」「ビルドコマンド」「デプロイ」を再読
- `docs/architecture.md`「TanStack Start」「データフロー」を再読
- `docs/ui-spec.md`「Notes 一覧 / 詳細」を再読 (この時点では情報構造のみ実装、見た目は Phase 4 / 8)
- 仕様の不備や齟齬を見つけたら、`CLAUDE.md`「仕様変更が必要な場合」のフロー

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
