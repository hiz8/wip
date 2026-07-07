# Works ページ移植 設計

- 日付: 2026-07-07
- ステータス: 承認済み

## 目的

参照リポジトリ `hiz.blue` の `/works` ページを本リポジトリへ移植する。works
ページは Obsidian Vault を情報源とせず、**リポジトリ内でコンテンツが完結する新カテゴリ**
の第一号である (今後 `about` / `now` などを同様に追加していく想定)。

## スコープ

- ナビゲーション (アイコンレール / モバイル下部) に `/works` への導線を追加する。
- `/works` ルートを追加し、`hiz.blue` の `/works` と同等の内容 (プロジェクト一覧 +
  Legacy/Archived) を表示する。
- 各プロジェクトのアイコン画像 4 点を移植する。

## 設計判断 (ブレインストーミングでの合意)

1. **ルート構成**: トップレベルの個別ルート (`src/routes/works/`)。共通スキャフォールドは
   作らず、`about` / `now` は必要時に同様に追加する (YAGNI)。ただし wip の慣習に従い、
   routes/ には**ルートファイルのみ**を置き、カード component は `src/components/`、
   データは `src/lib/` に分離する。
2. **ナビ配置**: アイコンナビの**末尾** (Blog の後)。
   `Home / Notes / Glossary / Books / Blog / Works`。
3. **ヘッダ様式**: wip の一覧ページ調に適応する。brand フォントの大見出し (`works`
   アイコン + "Works") + イタリック説明文、セクションは h2。

## アーキテクチャ

### 追加ファイル

#### 静的画像 (4 点コピー)

`hiz.blue/public/images/` → `wip/public/images/` にパスを維持してコピーする
(データ側のパス改変を不要にする)。

```
public/images/icon-ruby-blue-theme.png
public/images/icon-airbeat.svg
public/images/icon-gijione.svg
public/images/icon-cinemasaurus.svg
```

`public/` は Vite がルート配信するため `/images/icon-*.{svg,png}` で参照できる。
Vault 画像コピー (`scripts/post-build.ts` の `copyImages`) は `mkdir` + `copyFile`
のみでディレクトリを消さないため、静的画像と Vault 由来画像は `/images/` 配下で
共存できる。ファイル名が distinct (`icon-*`) のため basename 衝突もない。

#### `src/lib/works/data.ts`

`hiz.blue` の works / arcives 配列を忠実に移植する。

```ts
export interface Work {
  title: string;
  description: string;
  image?: string;
  urls: { type: "website" | "github"; url: string }[];
}

export const WORKS: Work[] = [ /* 6 件、表示順 (降順) で直書き */ ];
export const ARCHIVED: Work[] = [ /* 6 件、表示順 (降順) で直書き */ ];
```

`hiz.blue` の `id` 降順ソートは、配列を**表示順で直書き**して runtime ソートを
廃止する (挙動同一・簡素化)。ソート専用だった `id` フィールドも削除する。

移植する内容 (表示順):

- WORKS: Cinemasaurus, Giji one, airbeat, Noto Serif CJK JP min,
  Noto Sans CJK JP min, VS Code Ruby Blue Theme
- ARCHIVED: Spectacle Boilerplate SWC, hexo-theme-amp, Playground, Playlog,
  宜野湾 HUMAN STAGE, NAUTILUS OFFICIAL WEBSITE

各エントリの title / description / urls / image は `hiz.blue` の値をそのまま用いる。

#### `src/components/works/WorksCard.tsx`

StyleX で実装するカード。責務は 1 プロジェクトの表示のみ。

- レイアウト: 画像枠 (44px・角丸・画像なし時はプレースホルダ背景) + タイトル +
  説明 (`colors.textMuted`) + URL アイコンリンク群。
- URL リンク: `website` → `global` アイコン / `github` → `github` アイコン。
  `target="_blank" rel="noreferrer"` (wip の `SocialLinks` の外部リンク慣習に一致)。
- アクセシビリティ改善: `hiz.blue` はアイコンリンクにアクセシブルネームが無いため、
  `<a>` に `aria-label` ("Website" / "GitHub") を付与する。画像は `alt={title}`。

#### `src/routes/works/index.tsx`

- `createFileRoute("/works/")`。
- `head`: `makeTitle("Works")` + description meta。
- `AppShell variant="list"` を treeSidebar 無しで使用 (IconNav + 本文のみ、
  右サイドバー無し)。
- ヘッダ: brand フォント h1 (`works` アイコン + "Works") + イタリック説明文
  「これまで作ってきたプロダクトや公開物。」。見出し / 説明文のスタイルは
  `IndexPageHeader` の heading / sub と同じトークンを用いる (パンくずは持たない)。
- 本文: h2「Works」+ カードリスト、h2「Legacy / Archived」+ カードリスト。
- 静的データにつき loader は不要。`WORKS` / `ARCHIVED` を直接 import する。
  `vite.config.ts` の `prerender.crawlLinks` により、全ページに出るナビリンク経由で
  `/works` は自動プリレンダーされる。

### 変更ファイル

#### `src/components/layout/navSections.tsx`

- `NavSection.to` の union に `"/works"` を追加する。
- `NAV_SECTIONS` の**末尾**に追加する:
  `{ to: "/works", label: "Works", icon: "works", iconActive: "worksBold", isActive: sectionActive("/works") }`。
  works はコンテンツタイプではないため label は文字列リテラル "Works" とする
  (`CONTENT_TYPE_LABELS` は使わない)。
- `IconNav` / `MobileBottomNav` は `NAV_SECTIONS` から自動描画するため変更不要。

#### 変更不要

`src/components/common/Icon.tsx` は `works` / `worksBold` (および `global` /
`github`) が既に定義済みのため変更しない。

## テスト方針

移植固有のリスク (画像コピー漏れ・パスタイポ) を突く軽量テストを `src/lib/works/`
に配置する:

- `WORKS` / `ARCHIVED` の各 `image` パスが `public/images/` に実在すること。
- 各 `urls` が非空で、`type` が `"website" | "github"` の有効値であること。

UI は「重要な部分のみ」の方針に沿い、`WorksCard` の render smoke (画像有/無、
リンク描画) を最小限で用意する。

## 非対象 (YAGNI)

- `about` / `now` ページ自体の実装 (本移植では works のみ)。
- リポジトリ内完結ページの共通スキャフォールド / 抽象化。
- works データの外部化 (CMS 等) — 当面はコード内の静的データで足りる。
```
