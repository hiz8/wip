# アーキテクチャ

技術選定の理由、ディレクトリ構成、データフローを記述する。

## 技術選定

### TanStack Start (フレームワーク)

- ファイルベースルーティングと型安全なルーティングを提供
- SSR / SSG / クライアントレンダリングを統合的に扱える
- 本プロジェクトでは SSG 機能を中心に使用 (静的サイト生成)
- React エコシステムを採用するため、react-aria-components / StyleX との統合が容易

### react-aria-components (UI ライブラリ)

- アクセシビリティ要件 (WCAG 2.2 AA) を高い水準で担保
- ヘッドレスコンポーネントとしての性質により、StyleX でのスタイリングと干渉しない
- キーボード操作・スクリーンリーダー対応が組み込み

### StyleX (スタイリング)

- 型安全な CSS-in-JS、ビルド時に静的 CSS に変換
- ランタイムオーバーヘッドゼロ (サステナブル Web デザインの観点)
- テーマトークン機能を使ってダークモードを実装

### remark / unified (Markdown パーサー)

- AST ベースのプラグインエコシステム
- wiki-link、Callout、脚注、Embed などの拡張記法をプラグインで対応可能
- AST を直接操作することで、バックリンク収集や Marginalia 抽出が容易

### Shiki (シンタックスハイライト)

- VS Code と同じ TextMate 文法を使用
- ビルド時に静的にハイライト処理を行うためランタイムコストゼロ
- サステナブル Web デザインに合致

### Pagefind (全文検索)

- 静的サイト向けの全文検索ライブラリ
- ビルド成果物をスキャンしてインデックスを生成
- クライアントサイドで検索実行、サーバー不要
- インデックスのチャンク化により転送量を最小化

### Cloudflare Workers (ホスティング)

- グローバル CDN とエッジ配信
- Static Assets 機能で静的サイトを配信
- 将来的に動的機能 (フォーム、認証等) を追加する余地あり

### oxlint / oxfmt (リンター・フォーマッター)

- Rust 製で高速
- ESLint 互換のルールセットをサポート

## ディレクトリ構成

```
.
├── CLAUDE.md                   # Claude Code 用プロジェクトガイド
├── SPEC.md                     # 全体仕様
├── README.md                   # プロジェクト説明
├── docs/
│   ├── content-spec.md         # コンテンツ仕様
│   ├── ui-spec.md              # UI 仕様
│   ├── build-spec.md           # ビルド仕様
│   └── architecture.md         # 本ドキュメント
├── package.json
├── tsconfig.json
├── site.config.ts              # サイト設定
├── wrangler.jsonc              # Cloudflare Workers 設定
├── .env                        # 環境変数 (gitignore)
├── .env.example                # 環境変数テンプレート
├── public/                     # 静的アセット (favicon、OGP 画像等)
│   └── og-default.png
├── src/
│   ├── routes/                 # TanStack Start のルート定義
│   │   ├── __root.tsx
│   │   ├── index.tsx           # トップページ
│   │   ├── notes/
│   │   │   ├── index.tsx       # Notes 一覧
│   │   │   ├── $slug.tsx       # Notes 詳細
│   │   │   └── tags/
│   │   ├── glossary/
│   │   │   ├── index.tsx
│   │   │   ├── $slug.tsx
│   │   │   └── tags/
│   │   └── books/
│   │       ├── index.tsx
│   │       ├── $isbn.tsx
│   │       └── tags/
│   ├── components/             # UI コンポーネント
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # 全体シェル (variant: home/list/detail)
│   │   │   ├── IconNav.tsx         # 左端アイコンナビ
│   │   │   ├── TreeSidebar.tsx     # ツリーサイドバー (filter + ContentTree)
│   │   │   ├── DetailLayout.tsx    # 詳細ページレイアウト (Marginalia 枠予約)
│   │   │   └── RightSidebar.tsx    # TOC + Backlinks
│   │   ├── content/
│   │   │   ├── MarkdownRenderer.tsx  # Phase 6
│   │   │   ├── Marginalia.tsx        # Phase 6
│   │   │   ├── Callout.tsx           # Phase 6
│   │   │   ├── Footnote.tsx          # Phase 6
│   │   │   └── Toc.tsx
│   │   ├── tree/
│   │   │   ├── ContentTree.tsx       # react-aria-components Tree
│   │   │   └── TreeSearch.tsx        # react-aria-components TextField
│   │   ├── card/
│   │   │   ├── NoteCard.tsx
│   │   │   ├── BookCard.tsx          # Phase 5
│   │   │   └── GlossaryItem.tsx      # Phase 5
│   │   └── common/
│   │       ├── ThemeToggle.tsx       # 3-state cycle (system/light/dark)
│   │       └── Backlinks.tsx
│   ├── lib/
│   │   ├── content/            # コンテンツ収集・パース
│   │   │   ├── collect.ts          # ファイル列挙
│   │   │   ├── parse.ts            # frontmatter / Markdown パース
│   │   │   ├── validate.ts         # スキーマ検証
│   │   │   └── index.ts
│   │   ├── markdown/           # Markdown 変換
│   │   │   ├── pipeline.ts         # remark/rehype パイプライン
│   │   │   ├── plugins/
│   │   │   │   ├── wiki-link.ts
│   │   │   │   ├── embed.ts
│   │   │   │   ├── callout.ts
│   │   │   │   ├── footnote.ts
│   │   │   │   └── toc.ts
│   │   │   └── shiki.ts
│   │   ├── linkgraph/          # リンク解決・バックリンク
│   │   │   ├── resolve.ts
│   │   │   └── graph.ts
│   │   ├── search/             # Pagefind 連携
│   │   ├── feed/               # RSS / sitemap 生成
│   │   ├── tree/               # ツリー構築・フィルタ (純関数)
│   │   │   ├── buildTree.ts
│   │   │   └── filterTree.ts
│   │   ├── theme/              # ダークモードランタイム
│   │   │   ├── constants.ts
│   │   │   ├── useTheme.ts
│   │   │   └── themeScript.ts      # FOUC 抑止用インラインスクリプト
│   │   ├── seo/                # HEAD 補助
│   │   │   └── title.ts
│   │   └── config/             # 設定読み込み
│   │       ├── index.ts
│   │       └── static.ts           # クライアント向けの primitive ミラー
│   ├── server/                 # サーバ専用データレイヤー
│   │   ├── notes.ts                # getAllNotes / getNoteBySlug
│   │   └── loaders.ts              # createServerFn ラップ
│   ├── styles/                 # StyleX のテーマ・トークン
│   │   ├── tokens.stylex.ts
│   │   ├── theme.stylex.ts
│   │   └── reset.css
│   └── types/                  # 共有型定義
│       ├── content.ts
│       ├── config.ts
│       └── assets.d.ts             # *.css モジュール宣言
├── scripts/                    # ビルド・運用スクリプト
│   ├── build.ts
│   └── dev.ts
├── tests/                      # テスト
│   ├── fixtures/                   # モック Vault
│   └── lib/
└── .github/
    └── workflows/
        └── ci.yml
```

実装時に細部の調整が入る前提のレイアウトとする。

## データフロー

### ビルド時

```
Vault (NAS)
   │
   │ ① ファイル列挙 (lib/content/collect.ts)
   ▼
Markdown ファイル群
   │
   │ ② frontmatter パース + バリデーション
   ▼
コンテンツメタデータ
   │
   │ ③ ファイル名 / aliases / term の索引構築
   ▼
コンテンツインデックス
   │
   │ ④ Markdown → AST 変換 (remark)
   ▼
AST
   │
   │ ⑤ プラグイン適用
   │   - wiki-link 解決 → ハイパーリンク or テキスト
   │   - Embed 展開 (1 階層)
   │   - Callout 変換 (Marginalia 化)
   │   - 脚注抽出 (Marginalia 化)
   │   - 見出し抽出 (TOC)
   │   - リンクグラフ更新 (バックリンク用)
   ▼
変換済み AST + メタデータ
   │
   │ ⑥ HTML 化 (rehype) + Shiki ハイライト
   ▼
ページ HTML
   │
   │ ⑦ TanStack Start の SSG でルート別に出力
   ▼
dist/ (静的ファイル)
   │
   │ ⑧ Pagefind が dist/ をスキャン
   ▼
検索インデックス (dist/pagefind/)
   │
   │ ⑨ sitemap.xml / feed.xml 生成
   ▼
最終的なビルド成果物
```

### ランタイム (ブラウザ)

- 静的 HTML が初期表示される
- React によるハイドレーション後、以下の機能がクライアントサイドで動作:
  - ツリー検索のフィルタリング
  - 目次の現在地ハイライト (IntersectionObserver)
  - Pagefind による全文検索
  - ダークモードトグル
  - Marginalia のレスポンシブ表示切り替え

## 型定義の方針

`src/types/` 配下に共有型を集約する。主要な型の例:

```ts
// src/types/content.ts

export type ContentType = "notes" | "glossary" | "books";

export type Status = "published" | "draft" | "archived";

export interface BaseFrontmatter {
  status?: Status;
  tags?: string[];
  summary?: string;
  featured?: boolean;
  created?: string; // ISO 8601
  updated?: string; // ISO 8601
}

export interface NotesFrontmatter extends BaseFrontmatter {
  title?: string;
  created: string; // 必須
  updated: string; // 必須
}

export interface GlossaryFrontmatter extends BaseFrontmatter {
  term?: string;
  furigana?: string;
  aliases?: string[];
}

export interface BooksFrontmatter extends BaseFrontmatter {
  aliases: string[]; // 必須
  authors: string[]; // 必須
  isbn?: string;
  read_date?: string;
  pubYear?: number;
  publisher?: string;
  cover?: string;
}

export interface ContentItem<F = BaseFrontmatter> {
  type: ContentType;
  slug: string;
  filePath: string;
  frontmatter: F;
  body: string; // Markdown 本文
  html: string; // 変換後の HTML
  toc: TocEntry[];
  outgoingLinks: string[]; // このコンテンツから出ているリンク先 slug
  incomingLinks: BacklinkRef[]; // バックリンク
}

export interface TocEntry {
  depth: 2 | 3;
  text: string;
  id: string; // アンカー
}

export interface BacklinkRef {
  type: ContentType;
  slug: string;
  title: string;
}
```

実装時に細部を詰める前提の素描。

## テスト戦略

Vitest でユニットテスト・統合テストを記述する。

### 優先度の高いテスト対象

1. **frontmatter バリデーション** — 各コンテンツタイプのスキーマ検証
2. **wiki-link 解決** — 名前解決、曖昧性検出、非公開リンクの扱い
3. **Embed 展開** — 1 階層制限、循環参照検出
4. **Callout 変換** — 種別判定、private マーカーによる除外
5. **TOC 抽出** — H2/H3 のみの抽出、見出しなしの場合の扱い
6. **バックリンク構築** — リンクグラフの正確性
7. **slug 生成** — 日本語ファイル名、ISBN ファイル名

### Fixtures

`tests/fixtures/` に小規模なモック Vault を用意し、統合テストで使用する。

## 拡張ポイント

将来的な機能追加を見据えた拡張ポイントを意識する。

| 機能               | 拡張アプローチ                                                       |
| ------------------ | -------------------------------------------------------------------- |
| 差分ビルド         | コンテンツ収集ステージにハッシュ計算を組み込み、後段で差分検出       |
| 画像最適化         | 画像コピーステージを最適化処理に置き換え (sharp 等)                  |
| 動的 OGP           | rehype プラグインまたは個別ステージで Satori 等を使い OGP 画像生成   |
| サーバーサイド機能 | Workers のルートハンドラを TanStack Start で記述                     |
| 検索範囲拡大       | Pagefind の対象セレクタを調整 (タイトル + summary + tags → 本文含む) |
