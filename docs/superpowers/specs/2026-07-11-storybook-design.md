# Storybook 導入 設計

日付: 2026-07-11
目的: UI コンポーネントをアプリ全体 (Vault 接続 + SSG ルーティング) を起動せずに単体で開発・確認できる環境を用意し、コンポーネントの整理 (カタログ化) と新規開発を容易にする。

## 前提と制約

- スタック: Vite 8 / React 19 / TanStack Start (SSG) / StyleX 0.19 (`@stylexjs/unplugin` + custom moduleResolution) / react-aria-components
- テーマ: `<html>` への StyleX テーマクラス (`themeClasses.light/dark`) + `data-theme` / `data-theme-resolved` 属性 + `color-scheme` で切替。named CSS var 群 (`src/styles/*-vars.css`) は `data-theme-resolved` を参照
- グローバル CSS は `@layer` のカスケード順序に依存 (`reset, base, components, utilities` を先に宣言しておく必要がある)
- 多くのコンポーネントが `@tanstack/react-router` の `Link` に依存する
- Vault は外部にあり Storybook から参照しない。ストーリーはダミーデータで完結させる

## アプローチ比較

1. **Storybook 10 + `@storybook/react-vite` + 専用 Vite 設定 (採用)**
   `.storybook/vite.config.ts` を builder の `viteConfigPath` で指定し、alias / StyleX unplugin / `@vitejs/plugin-react` のみを載せる。`tanstackStart()` (SSG プリレンダー、サーバー機能) を Storybook に持ち込まず、干渉リスクを断つ。StyleX 設定はルート `vite.config.ts` と共有ヘルパーに抽出して二重定義を避ける。
2. プロジェクト `vite.config.ts` の自動マージ + `viteFinal` で TanStack Start 関連プラグインを除去
   フィルタが TanStack Start の内部プラグイン名に依存し、バージョンアップで静かに壊れる。不採用。
3. Ladle などの軽量代替
   要望が Storybook 指定のため対象外。

## 構成

```
.storybook/
  main.ts          — defineMain。stories glob、addon-a11y、framework + viteConfigPath
  vite.config.ts   — alias "@" + StyleX unplugin + react (tanstackStart なし)
  preview.tsx      — グローバル CSS import、テーマツールバー、router decorator
  preview-head.html — @layer 順序の先行宣言 (__root.tsx の LAYER_ORDER_HTML と同じ役割)
vite/stylex-plugin-options.ts — StyleX unplugin オプション生成をルート設定と共有
src/components/**/X.stories.tsx — ストーリー (コンポーネントにコロケーション)
```

- **テーマ切替**: ツールバーの `globalTypes` (light / dark) + カスタム decorator。本体の `useTheme.applyPreference` と同じ操作 (テーマクラス + `data-theme` / `data-theme-resolved` + `color-scheme`) を iframe の `documentElement` に適用する。localStorage には触れない
- **router decorator**: `createMemoryHistory` + 最小ルートツリーの `RouterProvider` で全ストーリーをラップし、`Link` 依存コンポーネントをそのまま描画できるようにする
- **StyleX dev CSS**: `@stylexjs/unplugin` は dev では `/virtual:stylex.css` を配信する。Storybook dev で link が自動注入されない場合は preview 側で dev 限定の `<link>` 追加で補う (本番 build はバンドルに含まれるため不要)。実装時に dev / build 両方で表示検証する

## 初期ストーリー (パターンの手本となる 4 つ)

| ストーリー         | 手本にするパターン                             |
| ------------------ | ---------------------------------------------- |
| `common/Icon`      | 純粋表示。全 `IconType` の一覧 + Controls      |
| `common/TagChips`  | router 依存 (`Link`) コンポーネント            |
| `common/Tooltip`   | react-aria-components の overlay               |
| `card/NoteListRow` | 一覧行 + `listRow` 共有スタイル + レスポンシブ |

以降のコンポーネントは上記を雛形に随時追加する。網羅は目的にしない。

## 周辺整備

- npm scripts: `storybook` (dev、port 6006) / `storybook:build`
- `.gitignore`: `storybook-static/`
- `tsconfig.json` の `include` に `.storybook/**/*` を追加 (stories は `src/**/*` で既にカバー)
- oxlint / eslint は既存設定のまま stories にも適用。ルール衝突が出た場合のみ `*.stories.tsx` の override を最小限追加
- ドキュメント: CLAUDE.md のコマンド一覧と `docs/implementation-log.md` に追記

## テスト・検証

- ストーリーは宣言的設定でありユニットテストは追加しない (ロジック層優先の方針を維持)
- 検証: `storybook dev` を起動しライト / ダーク両テーマで代表ストーリーの描画をブラウザ確認、`storybook build` の成功、`npm run typecheck` / `lint` / `test` / `fmt` が全て通ること

## 非スコープ

- Storybook test runner / interaction tests / visual regression
- 全コンポーネントのストーリー網羅
- Storybook の CI 組み込み・ホスティング
