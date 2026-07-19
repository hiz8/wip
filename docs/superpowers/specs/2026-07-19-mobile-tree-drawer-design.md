# モバイル TreeSidebar ドロワー 設計

日付: 2026-07-19
ステータス: 設計確定 (ブレインストーミングでユーザー承認済み。実装計画は writing-plans で別途作成)

## 目的

現状、モバイル表示 (`< 768px`) では `TreeSidebar` が `display: none` で完全に隠れ、
デスクトップにある兄弟コンテンツへのツリー導線が失われている。モバイルでもツリーへ
アクセスできるよう、左からスライドインするドロワーで `TreeSidebar` を表示する。

ユーザー指定の要件:

- モバイル表示時、パンくずの先頭にドロワー表示トリガーのアイコンボタンを出す
- トリガーをクリックすると左からドロワーが表示され、`TreeSidebar` が現れる
- ドロワーの範囲外をクリックすると閉じる

ブレインストーミングで確定した追加判断:

- 対象範囲は「ツリーを持つ全ページ」(Notes/Glossary/Books の詳細・一覧・タグ、Blog 一覧・タグ)
- トリガーアイコンは新規追加する panel-left (サイドバー) アイコン
- 状態は `AppShell` が保持し、Context でトリガーへ橋渡しする (下記「採用案」)

## 現状

- `TreeSidebar` は `AppShell` の `<aside styles.treeArea>` に置かれ、`treeArea` は
  `display: { default: "none", [BP_TABLET]: "block" }` で `< 768px` では非表示
  (`BP_TABLET = "@media (min-width: 768px)"`)
- `AppShell` は `treeSidebar` / `rightSidebar` を `ReactNode` prop で受け取り、
  `showTree = variant !== "home" && treeSidebar !== undefined` を持つ。ツリーを持つ
  全ページが `AppShell` に `treeSidebar` を渡している (Blog は `BlogTagTreeSidebar`)
- パンくずは 2 系統:
  - `Breadcrumb` (`src/components/common/Breadcrumb.tsx`) — `DetailShell` (詳細) と
    `IndexPageHeader` (一覧) が共用。root/optional middle/current の 3 段固定
  - `BlogBreadcrumb` (`src/components/blog/BlogBreadcrumb.tsx`) — Blog 専用の可変長チェーン
- モーダルの既存パターンは `SearchDialog` (`src/components/common/SearchDialog.tsx`):
  react-aria-components 1.19 の `ModalOverlay` + `Modal` + `Dialog` を `isDismissable`
  で使用。範囲外クリック閉じ・Esc・フォーカストラップ・body スクロールロックが得られる
- `Icon.tsx` に「メニュー/サイドバー」を明確に表すアイコンはない (`menuDots`・`notebook` は含意が弱い)
- 共有アイコンボタンスタイル `navChrome.iconButton` はナビレール (深ブルー背景) 向けの配色で、
  明色のパンくず上には合わない → 別途コンテンツ配色のボタンスタイルが要る

## 設計判断

### 1. 状態の持ち方 — AppShell + React Context (採用案)

トリガーは「パンくずの先頭」(= 本文内)、ドロワー本体は `treeSidebar` ノードを持つ
`AppShell` 側と、置き場所が離れる。`AppShell` を単一の情報源にして Context で橋渡しする。

- `AppShell` が `drawerOpen` state を持ち、`showTree` のときだけドロワーを描画する
- Context 値 `{ hasTree: boolean; open: () => void }` を Provider で子孫へ渡す
- `Breadcrumb` / `BlogBreadcrumb` が Context を読み、`hasTree` のときトリガーを先頭に描画

利点: ツリーを持つ全ページが自動で対応する / 各ルートへの配線が不要 / `treeSidebar`
ノードをそのまま再利用できる。

### 2. ドロワー本体 — react-aria-components Modal (SearchDialog と同型)

`TreeDrawer` (`src/components/layout/TreeDrawer.tsx`、新規):

- `ModalOverlay`(`isOpen` / `onOpenChange` / `isDismissable`) + `Modal` + `Dialog`
- `Modal` は左寄せ・全高・幅 16rem 程度 (`treeArea` の `minmax(220px, 16rem)` に揃える)
- `Dialog` に `aria-label` (例: "コンテンツツリー")
- `children` に `AppShell` から渡された `treeSidebar` ノードを描画
- `ModalOverlay` は `isOpen=false` のとき children を mount しないため、デスクトップでは
  ドロワー側の `TreeSidebar` インスタンスは生成されない (開いたときだけ mount)。
  モバイルで開くと、非表示の `<aside>` 側と合わせ一時的に 2 インスタンスになるが許容
- 開くたびに再 mount されるため、`TreeSidebar` 内部状態 (検索クエリ・展開状態) は
  リセットされる。モバイルのドロワー UX として望ましい挙動

範囲外クリック閉じは `isDismissable`、Esc 閉じ・フォーカストラップ・スクロールロックは
RAC が標準で担う (要件「範囲外クリックで閉じる」を満たす)。

### 3. トリガー — panel-left アイコンのモバイル限定ボタン

`TreeDrawerTrigger` (`src/components/layout/TreeDrawerTrigger.tsx`、新規):

- Context を読み、`hasTree` が false なら何も描画しない
- `display: { default: "inline-flex", [BP_TABLET]: "none" }` でモバイル限定表示
- クリックで Context の `open()` を呼ぶ。`aria-label` (例: "コンテンツツリーを開く")
- 配色はパンくず (明色背景) に合うコンテンツ用トークン (`colors.textMuted` 基調、hover で
  `colors.link` 等)。`navChrome.iconButton` はナビレール専用配色なので流用しない
- サイズはパンくず (`fontSizeXs`/`Sm`) に馴染む控えめな寸法にする (44px 一律ではなく調整)。
  最終寸法は実装時に既存パンくずと並べて詰める

`Icon.tsx` に panel-left の data URI マスクを 1 つ追加する (Solar セットに合わせ、
既存アイコンと同じくファイル内フラット const で静的 inline 化する制約に従う)。
`IconType` に `panelLeft` を追加。

### 4. トリガーの配置 — パンくずの先頭

`Breadcrumb` / `BlogBreadcrumb` の `<nav>` を flex 行にし、`<Breadcrumbs>` (ol) の前に
`<TreeDrawerTrigger>` を置く。トリガーはクラム項目ではなくボタンなので `ol` の外に置き、
セマンティクスを保つ。両コンポーネントとも同じ扱いにして Blog も対応する。

`IndexPageHeader` は内部で `Breadcrumb` を描画するだけなので変更不要 (Context 経由で
トリガーが自動的に出る)。`DetailShell`・各一覧/タグルート・`BlogListPage` も配線変更不要。

### 5. 遷移時の自動クローズ

TanStack Router はクライアント遷移でも root レイアウト (`AppShell`) を保持し続けるため、
ツリー項目タップで遷移してもドロワー state が残る。`AppShell` で現在パスを購読し、
変化したらドロワーを閉じる:

```
const pathname = useRouterState({ select: (s) => s.location.pathname });
useEffect(() => { setDrawerOpen(false); }, [pathname]);
```

### 6. スライドインとレスポンシブ

- 左からのスライドインは RAC が付与する entering/exiting 状態 (`data-entering` /
  `data-exiting` 相当) を使った軽い transition で表現する。StyleX との相性で難しければ
  初版はアニメーションなしでも要件 (「左から表示」= 左寄せ配置) は満たす
- トリガーもドロワーも `< 768px` 前提。開いた状態で `≥ 768px` にリサイズされた場合の
  自動クローズは nice-to-have (`matchMedia` で対応可、初版では任意)

## コンポーネント構成

```
src/components/layout/TreeDrawerContext.tsx   … { hasTree, open } の Context (新規)
src/components/layout/TreeDrawer.tsx          … ModalOverlay+Modal+Dialog (新規)
src/components/layout/TreeDrawerTrigger.tsx   … モバイル限定トリガーボタン (新規)
src/components/layout/AppShell.tsx            … drawerOpen state / Provider / TreeDrawer / 遷移時クローズ (変更)
src/components/common/Breadcrumb.tsx          … nav を flex 行にしトリガーを先頭へ (変更)
src/components/blog/BlogBreadcrumb.tsx        … 同上 (変更)
src/components/common/Icon.tsx                … panelLeft アイコン追加 (変更)
```

## テスト

- `tests/components/TreeDrawer.test.tsx` — トリガー押下で開く / Esc・範囲外クリックで閉じる /
  Dialog に `aria-label` がある / 開いたときにツリー内容が描画される
- `tests/components/Breadcrumb.test.tsx` (または新規) — `hasTree=true` の Context で
  トリガーが描画され、`hasTree=false` では描画されないこと
- `AppShell` の遷移時クローズ: パス変化で `drawerOpen` が false になること
  (router モック or `useRouterState` のモックで検証)
- Storybook に `TreeDrawer` のストーリーを追加 (Vault 不要のダミーツリーで開閉を確認)

## 採用しなかった案

- **各シェルが状態を持ち props で渡す (案B)**: `DetailShell`・各一覧/タグルート・
  `BlogListPage` にそれぞれ状態・トリガー・ドロワーを配線する必要があり重複が大きい。
  `IndexPageHeader` へ tree を新規に流す配線も要る。Context 案の方が変更点が集約される
- **AppShell がパンくず外に浮遊トリガーを置く (案C)**: Context 不要で最小だが、
  「パンくずの先頭」という要件を満たせない
- **トリガーに既存 `menuDots` / `notebook` を流用**: 新規アセット不要だが、`menuDots` は
  「その他メニュー」、`notebook` はナビの Notes 系アイコンと紛らわしい。panel-left の方が
  「左のサイドバー/ツリーを開く」を明確に表す

## 将来拡張 (本設計の対象外)

- 開状態でのブレイクポイント跨ぎ (`≥ 768px` へのリサイズ) 時の自動クローズ
- スライドインアニメーションの作り込み (初版は最小限)
