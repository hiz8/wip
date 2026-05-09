# ビルド仕様

ビルドパイプライン、設定ファイル、リンク解決ロジック、デプロイフローを定義する。

## ビルドコマンド

| コマンド | 用途 |
| --- | --- |
| `npm run dev` | 開発サーバー起動 + Vault のウォッチモード (変更時に自動再ビルド) |
| `npm run build` | 本番ビルド (静的サイト全体を生成) |
| `npm run preview` | ビルド成果物のローカルプレビュー |
| `npm run deploy` | `wrangler deploy` を実行して Cloudflare Workers にデプロイ |
| `npm run lint` | oxlint によるリント |
| `npm run format` | oxfmt によるフォーマット |
| `npm run test` | Vitest によるテスト実行 |
| `npm run typecheck` | TypeScript の型チェック |

## ビルドパイプライン

`npm run build` で実行される処理の順序:

1. **設定読み込み** — `site.config.ts` および `.env` の読み込み・検証
2. **コンテンツ収集** — 設定で指定された各パスから Markdown ファイルを列挙 (Notes は除外パターンを適用)
3. **frontmatter パース** — 全ファイルの frontmatter を読み取り、スキーマバリデーション
4. **status フィルタ** — `draft` / `archived` のコンテンツを除外
5. **コンテンツインデックス構築** — リンク解決のためのファイル名 / aliases / term の索引を構築
6. **Markdown パース** — remark / unified で AST に変換
7. **AST 変換** — wiki-link 解決、Embed 展開、Callout 変換、脚注抽出、見出し抽出 (TOC 用)、バックリンク収集
8. **シンタックスハイライト** — Shiki でコードブロックを処理
9. **HTML 生成** — TanStack Start の SSG 機能で各ページを HTML 化
10. **画像コピー** — Vault 内の参照画像を `public/` 配下にコピー
11. **検索インデックス生成** — Pagefind がビルド成果物をスキャンしてインデックス生成
12. **サイトマップ / RSS 生成** — `sitemap.xml` と Notes の RSS フィードを生成

### 開発モード (`npm run dev`)

- 上記パイプラインに加え、Vault ディレクトリのファイル変更を `chokidar` 等で監視
- 変更検出時は該当ファイルの再パース + 影響範囲の再生成
- ブラウザの HMR で UI に即時反映

## 差分ビルドの方針

初期段階では **全再生成** とする。Vault の規模 (数百ノート程度を想定) であれば、十数秒〜数十秒で完了する想定。

将来的な差分ビルドへの移行を見据え、以下を意識した設計とする:

- ビルド処理は「コンテンツ収集」「パース」「変換」「レンダリング」「アセット処理」の各ステージに分割
- 各ステージの中間成果物 (AST、メタデータ、リンクグラフ) を型で明確に定義
- ファイル単位のハッシュ計算ロジックを早期に組み込む (実際の差分ビルドは後で有効化)
- リンクグラフ (双方向リンク・Embed 関係) を構築済みにしておくことで、後から「変更ファイル + 影響を受けるファイル」のセットを算出可能にする

## 設定ファイル

設定ファイルは TypeScript で記述する (`site.config.ts`)。型安全と IDE 補完を確保するため。

### スキーマ (例)

```ts
// site.config.ts
import { defineConfig } from './src/config'

export default defineConfig({
  // サイト基本情報
  site: {
    name: '(サイト名)',
    description: '(サイトの説明)',
    url: 'https://example.com',
    locale: 'ja',
    ogImage: '/og-default.png',
  },

  // 著者情報
  author: {
    name: '(著者名)',
    bio: '(簡潔な紹介)',
    socialLinks: [
      { label: 'GitHub', url: 'https://github.com/...', icon: 'github' },
      { label: 'X', url: 'https://x.com/...', icon: 'x' },
    ],
  },

  // コンテンツソース
  content: {
    vaultRoot: process.env.VAULT_ROOT,  // .env で指定
    notes: {
      path: '.',  // Vault 直下
      exclude: ['Glossary/**', 'Books/**', 'Clips/**', '_site/**'],
    },
    glossary: {
      path: 'Glossary',
    },
    books: {
      path: 'Books',
    },
  },

  // サイト固有コンテンツ (ハイブリッド方式)
  pages: {
    home: {
      introMarkdown: '_site/home.md',  // 自己紹介本文の Markdown
      aboutMarkdown: '_site/about.md',  // サイト説明本文の Markdown
    },
  },

  // ビルド設定
  build: {
    outDir: 'dist',
    publicDir: 'public',
    strict: true,  // バリデーションエラーをビルドエラーにする
  },

  // 機能フラグ
  features: {
    rss: true,
    sitemap: true,
    search: true,  // Pagefind 有効化
  },
})
```

### 環境変数 (`.env`)

| 変数名 | 用途 |
| --- | --- |
| `VAULT_ROOT` | Vault のルートパス (例: `/Volumes/NAS/Obsidian/Main`) |
| `SITE_URL` | 本番サイトの URL (本番ビルド時に使用) |

`.env.example` をリポジトリに含め、`.env` は gitignore する。

## リンク解決

### 名前解決アルゴリズム

`[[link-target]]` の解決は以下の順序で行う。

1. **コンテンツタイプ明示パス** — `[[Notes/foo]]` 形式は対応するタイプのファイル名一致を優先
2. **ファイル名一致** — 拡張子なしのファイル名と完全一致 (全コンテンツタイプ横断)
3. **aliases 一致** — Books / Glossary の `aliases` 配列内の任意要素と完全一致
4. **term 一致** — Glossary の `term` フィールドと完全一致
5. **未解決** — リンクをテキスト化

### 曖昧解決のエラー処理

ステップ 2-4 で複数のコンテンツが該当した場合、ビルドエラーとする。リンク元のファイルパスとリンク文字列、衝突した候補を含むエラーメッセージを出力する。

明示的な解消方法としてコンテンツタイプ付きの記法 (`[[Notes/foo]]`、`[[Books/9784xxx]]` 等) を案内する。

### 非公開コンテンツへのリンク

リンク先のコンテンツが存在するが `status` により非公開の場合、リンクは削除されテキストのみが残る。これはビルドエラーとはしない。

## バックリンク収集

ビルド時に全コンテンツの内部リンクを走査し、リンクグラフを構築する。各コンテンツについて「自分にリンクしているコンテンツ」を逆引きできる構造を構築し、詳細ページの右サイドバーで表示する。

- バックリンクの並び順は `updated` 降順
- 同じページから複数回リンクされていても、バックリンク一覧では 1 件として扱う

## Embed 展開

`![[note]]` 記法による Embed は以下のルールで展開する。

- 1 階層のみ展開する (Embed 内の Embed はリンク化)
- リンク先のコンテンツの本文部分を該当箇所にインライン展開する (frontmatter は含めない)
- Embed 先のコンテンツへのハイパーリンク (出典) を併記する
- 循環参照は検出した時点で展開を打ち切る

## サイトマップ・RSS

### サイトマップ (`sitemap.xml`)

ルート直下に配置。すべての公開コンテンツの URL を含める。

- 各エントリに `<lastmod>` を含める (コンテンツの `updated` を使用)
- タグ別ページなど派生ページも含める

### RSS フィード

`/feed.xml` として Notes の更新フィードを生成する。

- Notes のみが対象 (Glossary、Books は対象外)
- `updated` 降順で最新 N 件 (件数は実装時に決定、初期値 20)
- 各エントリに `title`、`summary` (あれば)、`updated`、`link` を含める

## デプロイ

### Cloudflare Workers (Static Assets)

ホスティングは Cloudflare Workers の Static Assets 機能を使用する。

- ビルド成果物 (`dist/`) を配信対象とする
- `wrangler.toml` (または `wrangler.jsonc`) でアセットの配信設定を記述
- カスタムドメインの設定は別途

### デプロイコマンド

```bash
# ローカルビルド + デプロイ
npm run build
npm run deploy
```

`npm run deploy` は内部で `wrangler deploy` を呼び出す。

### CI 経由のデプロイ (将来的に)

GitHub Actions による自動デプロイも構成可能とする。ただし NAS 上の Vault を CI 環境から参照する必要があるため、運用方法は別途検討:

- 候補 1: Vault を Git リポジトリ化して CI からチェックアウト
- 候補 2: NAS から CI へのコンテンツ同期メカニズムを構築
- 候補 3: ローカルビルドのみ運用

初期段階ではローカル `wrangler deploy` のみとする。

## CI (GitHub Actions)

サイトコードのリポジトリに対する PR / push で以下を実行:

1. **型チェック** — `npm run typecheck`
2. **リント** — `npm run lint`
3. **テスト** — `npm run test`
4. **ビルド検証** — モックの Vault または fixtures を使ったビルド成功確認

実際のコンテンツを使った本番ビルドは行わない (Vault が CI からアクセス不可のため)。

## 画像処理

- ビルド時に Vault 内の参照画像を `public/` 配下にコピー
- 初期版では最適化処理なし (元ファイルをそのまま配信)
- 将来的に WebP 変換 / 複数解像度対応 / `<picture>` 化を検討

画像のパス解決は Markdown 内の参照を辿って行う。Markdown で参照されていない画像はコピーしない (孤立画像のクリーンアップ)。

## エラーハンドリング

ビルド時のエラーは以下のカテゴリで分類してログ出力する。

| カテゴリ | レベル | 例 |
| --- | --- | --- |
| 設定エラー | Error (中断) | `site.config.ts` のスキーマ違反、Vault パスが存在しない |
| frontmatter エラー | Error (中断) | 必須フィールド欠損、型不一致 |
| リンク解決エラー | Error (中断) | 曖昧なリンク、未解決リンク (※非公開リンクは除く) |
| 画像参照エラー | Error (中断) | 存在しない画像への参照 |
| 警告 | Warning (継続) | 未使用画像、空の本文など |

`build.strict: false` の場合は Error も Warning として継続するが、デフォルトは `strict: true`。
