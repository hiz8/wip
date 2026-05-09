# 実装ログ

各フェーズの完了状況、主要 API、設計判断、次フェーズへの引き継ぎメモを記録する。
別チャット / 別セッションへ作業を引き継ぐための一次ソース。

段階分けは `CLAUDE.md` の「段階的な実装方針」に対応する。

## サマリ

| Phase | 内容 | 状態 | 完了日 |
| --- | --- | --- | --- |
| 1 | コンテンツ収集とパース (Notes 最小構成) | ✅ Done | 2026-05-09 |
| 2 | Markdown 変換とリンク解決 | ⏳ Not started | — |
| 3 | 基本的なルーティング (Notes 詳細・一覧) | ⏳ Not started | — |
| 4 | レイアウト (アイコンナビ・ツリー・本文) | ⏳ Not started | — |
| 5 | Glossary / Books の対応 | ⏳ Not started | — |
| 6 | Marginalia / 目次 / バックリンク | ⏳ Not started | — |
| 7 | 検索 / RSS / sitemap | ⏳ Not started | — |
| 8 | デザインの作り込み | ⏳ Not started | — |

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

## Phase 2 — Markdown 変換とリンク解決 (引き継ぎメモ)

### 想定スコープ

- Markdown → mdast 変換 (`remark` + `remark-parse` + `remark-gfm`)
- wiki-link 解決プラグイン (`docs/build-spec.md` 「リンク解決」)
- Embed 展開プラグイン (1 階層、循環検出)
- Callout 変換プラグイン (`note` / `quote` / `tip` / `info` / `warning`、`private` 除外)
- 脚注抽出 (Marginalia 用にメタデータ化、本文中はマーカーを残す)
- TOC 抽出 (H2 / H3)
- 画像参照の収集 (実コピーは Phase 7 以降)
- リンクグラフ構築 (バックリンク逆引き用)
- HTML 化 (`rehype-stringify`) + Shiki ハイライト

### 推奨アプローチ

- 各 remark/rehype プラグインは単機能で実装し、AST 操作の Vitest テストを必ず付ける (`docs/architecture.md` 「テスト戦略」と CLAUDE.md「Markdown 処理」)
- リンク解決には Notes / Glossary / Books のインデックスが必要だが、Phase 5 まで Glossary/Books を遅延すると wiki-link 解決のテストが Notes に閉じてしまう。**現実的には Phase 2 で「Notes 同士のリンク解決」を実装し、Phase 5 で Glossary/Books のインデックスを足してリンク解決を完成させる** という分割が自然
- `ContentItem` 型は `html` / `toc` / `outgoingLinks` / `incomingLinks` を加えた拡張型を新設するか、`ContentItem` 自体を拡張する。Phase 1 のコメント方針 (「段階的に育てる」) を踏まえてどちらかを選ぶ

### 着手前の確認

- `docs/build-spec.md`「リンク解決」「Embed 展開」「バックリンク収集」を再読する
- `docs/content-spec.md`「Markdown 拡張記法」を再読する
- 仕様の不備や齟齬を見つけたら、CLAUDE.md「仕様変更が必要な場合」のフローに従う

## Phase 3 〜 8 (概要のみ)

| Phase | 主な作業 | 主要参照 |
| --- | --- | --- |
| 3 | TanStack Start 導入、Notes 一覧 / 詳細ルートの SSG 出力 | `docs/architecture.md`, `docs/ui-spec.md`「Notes 一覧/詳細」 |
| 4 | AppShell / IconNav / TreeSidebar / DetailLayout、StyleX 導入 | `docs/ui-spec.md`「全体レイアウト」 |
| 5 | Glossary / Books の収集・パース・ルート、五十音インデックス、ISBN slug | `docs/content-spec.md`, `docs/ui-spec.md`「Glossary/Books」 |
| 6 | Marginalia 配置、TOC ハイライト (IntersectionObserver)、バックリンク表示 | `docs/ui-spec.md`「Marginalia」「右サイドバー」 |
| 7 | Pagefind、RSS、sitemap、画像コピー | `docs/build-spec.md`「サイトマップ・RSS」「画像処理」 |
| 8 | デザイントークン詰め、ダークモード、レスポンシブ調整 | `docs/ui-spec.md`「ダークモード」「レスポンシブ」 |

差分ビルド・画像最適化・動的 OGP は本ロードマップ外 (将来課題)。

## ログ更新ルール

- フェーズ完了時にこのファイルを更新する (達成範囲・公開 API・主要ファイル・設計判断)
- 次フェーズの「引き継ぎメモ」も同タイミングで更新する
- 完了済みフェーズの「引き継ぎメモ」は履歴として残してよいが、必要に応じて簡略化する
