# SPEC

Obsidian の Vault をソースとした、個人ブランディング目的の Digital Garden 型 Web サイトの仕様書。

## 目的

Obsidian で管理している Web デザイン・開発に関するメモ (知見、考え方、頻繁に参照する情報) を、自分自身の作業効率向上のために蓄積している。これらは Digital Garden の考え方に基づき、定期的に手を加えて整理している。

このサイトは、それらのメモをソースとして個人ブランディングを目的に立ち上げる。チームメイトや第三者に対し、自身の知識・スキル・関心領域を可視化し、理解の手がかりとなることを目指す。

## コンテンツ

Obsidian の単一 Vault 内で管理する 3 種のコンテンツをサイトのソースとする。

- **Notes** — トピックごとの知識メモ。Vault 直下に配置。サブフォルダによる階層構造を持つ。
- **Glossary** — 単語・用語のメモ。`Glossary/` フォルダ配下にフラットに配置。
- **Books** — 読了書籍の簡易メモ。`Books/` フォルダ配下にフラットに配置。ファイル名は ISBN。
- **Blog** — 「よりストック型の、フローしないブログ」。`Blog/` フォルダ配下にフラットに配置。ファイル名は作成日時。タグの組み合わせ自体がページとなる。詳細は `docs/blog-spec.md`。

Vault 内の `Clips/` フォルダおよびその他のファイルはサイトのソースには含めない。

## ページ構成

| URL                    | 内容                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| `/`                    | トップページ                                                                                  |
| `/notes`               | Notes 一覧ページ                                                                              |
| `/notes/[slug]`        | Notes 詳細ページ                                                                              |
| `/notes/tags`          | Notes のタグ一覧ページ                                                                        |
| `/notes/tags/[tag]`    | Notes のタグ別一覧ページ                                                                      |
| `/glossary`            | Glossary 一覧ページ                                                                           |
| `/glossary/[slug]`     | Glossary 詳細ページ                                                                           |
| `/glossary/tags`       | Glossary のタグ一覧ページ                                                                     |
| `/glossary/tags/[tag]` | Glossary のタグ別一覧ページ                                                                   |
| `/books`               | Books 一覧ページ                                                                              |
| `/books/[isbn]`        | Books 詳細ページ                                                                              |
| `/books/tags`          | Books のタグ一覧ページ                                                                        |
| `/books/tags/[tag]`    | Books のタグ別一覧ページ                                                                      |
| `/blog`                | Blog トップページ                                                                             |
| `/blog/page/[n]`       | Blog トップのページネーション                                                                 |
| `/blog/tags/[tagset]`  | Blog タグ詳細ページ (ファセット集合を連結した正規形の単一セグメント。集合は `+`、階層は `--`) |
| `/blog/feed.xml`       | Blog の Atom フィード                                                                         |
| `/404`                 | Not Found ページ                                                                              |

Blog のページ構成・ページネーション・タグ集合 URL の詳細は `docs/blog-spec.md` を参照。

タグの名前空間はコンテンツタイプごとに分離する。Notes の `#react` と Books の `#react`、Blog の `#react` はそれぞれ別物として扱う。

## UI

- 画面最左に縦並びアイコンバーとしてメインナビゲーション (Notes / Glossary / Books へのリンク)
- メインナビゲーションの右に、現在選択中のコンテンツタイプのツリー (検索ボックス付き)
- ツリーの右に、コンテンツの表示領域
- コンテンツの表示には、必要に応じて Marginalia (脚注、Callout) が左右余白に配置される
- 詳細ページの右側に目次とバックリンク

詳細は `docs/ui-spec.md` を参照。

## アーキテクチャ

- ソース: NAS 上の Obsidian Vault。設定ファイルでパス指定して参照する
- ビルド: 単一の `npm run build` コマンドで全工程を実行 (コンテンツ収集 → 静的サイト生成)
- 開発: `npm run dev` でウォッチモード (Vault の変更を監視して自動再ビルド)
- 生成方式: 完全な静的サイト生成 (SSG)。初期版は全再生成、将来的に差分ビルドへの移行を見据えた構造とする
- ホスティング: Cloudflare Workers (Static Assets)
- デプロイ: 手動 `wrangler deploy` を基本とし、CI 経由のデプロイも将来的に可能な構成とする

詳細は `docs/architecture.md` および `docs/build-spec.md` を参照。

## 技術スタック

- **フレームワーク**: TanStack Start
- **UI ライブラリ**: react-aria-components
- **スタイリング**: StyleX
- **言語**: TypeScript (`strict: true` + 追加の厳格オプション)
- **Markdown パーサー**: remark / unified エコシステム
- **シンタックスハイライト**: Shiki (ビルド時に静的処理)
- **全文検索**: Pagefind (クライアントサイド、ビルド時インデックス生成)
- **リンター・フォーマッター**: oxlint / oxfmt
- **テスト**: Vitest
- **CI**: GitHub Actions
- **パッケージマネージャ**: npm
- **ホスティング**: Cloudflare Workers

## アクセシビリティ・ブラウザ要件

- WCAG 2.2 AA 準拠
- ダークモード対応 (OS 設定への追従とトグル切り替えの両方)
- Modern browsers のみ (直近 2 バージョン)
- 言語: 日本語のみ

## 公開制御

各コンテンツの frontmatter `status` フィールド (任意) によって制御する。

- `published` (デフォルト) — 公開
- `draft` — 非公開
- `archived` — 非公開

非公開コンテンツはビルド成果物に含まれない。非公開コンテンツへの内部リンクはテキスト化される。

## 関連ドキュメント

- `docs/content-spec.md` — コンテンツ仕様 (frontmatter スキーマ、Markdown 拡張記法)
- `docs/ui-spec.md` — UI 仕様 (レイアウト、各ページ構成、レスポンシブ)
- `docs/build-spec.md` — ビルド仕様 (パイプライン、設定ファイル、リンク解決)
- `docs/blog-spec.md` — Blog 仕様 (タグ集合/階層タグページ、単一セグメント URL、タグツリー)
- `docs/architecture.md` — アーキテクチャ (技術選定理由、ディレクトリ構成)
- `CLAUDE.md` — Claude Code 用プロジェクトガイド
