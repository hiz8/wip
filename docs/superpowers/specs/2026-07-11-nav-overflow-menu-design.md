# ナビゲーション オーバーフローメニュー 設計

日付: 2026-07-11
ステータス: 実装と同時進行 (ユーザー要求仕様が詳細だったため、未確定点はここに明記した推定で進める)

## 目的

ナビ項目 (現在 6: Home / Notes / Glossary / Books / Blog / Works) の増加に備え、
タップサイズを確保できないときに末端項目をメニューへ退避する仕組みを導入する。

ユーザー指定の仕様:

- Blog の次に「ドットアイコン」(暫定デザイン) を置き、クリックでメニューを表示。Works はメニューへ移す
- メニュー項目のアイコンは任意。アイコンなしの項目はラベル位置を揃えるため空白を表示
- モバイル: 個々のアイテムの横幅が 56px 以下となる場合、末端アイテムをさらにメニューへ
- デスクトップ: 個々のアイテムの高さが 44px 以下となる場合、末端アイテムをさらにメニューへ
- メニューは react-aria の Menu をまず検討する

## 現状

- `NAV_SECTIONS` (`src/components/layout/navSections.tsx`) を `IconNav` (≥768px の縦レール)
  と `MobileBottomNav` (<768px のボトムバー) が共有
- レールのボタンは 44×44px 固定・`gap: 16px`・`paddingBlock: 12px`、検索ボタンとテーマトグルを常設
- ボトムバーは高さ 56px、タブは `flexGrow: 1` の等分割

## 設計判断

### 1. データモデル (`navSections.tsx`)

```
MenuNavSection  … to / label / isActive + icon?, iconActive? (アイコン任意)
NavSection extends MenuNavSection … icon / iconActive 必須 (バー表示にはアイコンが要る)

NAV_SECTIONS: NavSection[]        = [Home, Notes, Glossary, Books, Blog]  // 常設候補
MENU_NAV_SECTIONS: MenuNavSection[] = [Works]                              // 常時メニュー
```

今後の低重要度ページは `MENU_NAV_SECTIONS` に追加するだけでよい。アイコン省略可。

### 2. オーバーフローのしきい値 — 静的に列挙した media query

ナビ項目数はビルド時に確定しているため、「何個表示できるか」は media query の
組で表現できる。JS 計測 (ResizeObserver) を使わないので SSG のプリレンダー HTML
だけで正しい表示になり、hydration 前のちらつきがない。

導出 (`src/lib/nav/overflowThresholds.ts` に純関数として実装、テストで担保):

- **モバイル (幅)**: タブは等分割なので、セクション i (0-based) までを表示 +
  ドットトリガーの `i+2` タブ構成で 1 タブ幅が 56px 以下になる条件は
  `vw ≤ 56×(i+2)`。→ Notes 168 / Glossary 224 / Books 280 / Blog 336 (px)
- **デスクトップ (高さ)**: レール所要高 = padding 24 + ボタン 44×(S+3) + gap 16×(S+4)
  = `60S + 220` (S = 表示セクション数、+3 は検索・ドット・テーマトグル)。
  セクション i を隠す条件は `vh ≤ 60×(i+1) + 220`。
  → Notes 340 / Glossary 400 / Books 460 / Blog 520 (px)
- Home は退避しない (フロア = Home + ドット)
- 「以下」(≤) はユーザー仕様の文言どおり境界値でも退避する

CSS 側: 各ナビコンポーネント内のフラットな文字列 const (StyleX の制約) として
media query を持ち、該当セクションのリンクを `display: none` にする。
テストが「component の const == 純関数の出力」を検証し、二重定義の乖離を防ぐ。

### 3. メニュー内容の同期 — `useOverflowCount`

メニューの中身 (退避されたセクション + Works) は JS で決める必要がある。
CSS と同じ media query 文字列を `matchMedia` + `useSyncExternalStore` で監視し、
マッチ数 = 退避された末尾セクション数として `NAV_SECTIONS.slice()` する。
サーバースナップショットは 0 (メニュー自体が JS 必須の UI なので不整合は起きない)。

### 4. メニュー UI — react-aria-components Menu + TanStack `createLink`

`MenuTrigger + Button + Popover + Menu + MenuItem` (react-aria-components 1.19)。
内部リンク遷移は TanStack Router 公式ドキュメントの手順に従い
`createLink(MenuItem ラッパー)` を使う (v1.11.0+ で対応、preload intent も効く)。
RouterProvider 方式より宣言的で、`to` の型安全も得られる。
出典: <https://tanstack.com/router/latest/docs/framework/react/guide/custom-link>
(React Aria Components セクション)、<https://react-aria.adobe.com/Menu>

- 項目レイアウトは「固定幅アイコンスロット + ラベル」。アイコンなしでも
  スロットを空のまま描画し、ラベルの縦位置を揃える (ユーザー仕様)
- 現在地の項目は Bold アイコン + セミボールド文字で表示
- hover/focus 状態は render prop の className で StyleX クラスを切り替える
  (Tooltip.tsx と同じ、両ライブラリの公式 API のみで完結する方式)
- Popover の placement: レール = `end` (右)、ボトムバー = `top`

### 5. トリガー

- 暫定ドットアイコン: 横 3 点 (`menuDots`) を `Icon.tsx` に追加。ラベルは "More"
- レール: 44×44 アイコンボタン + Tooltip (他のレールボタンと同じ見た目)
- ボトムバー: 他タブと同じ「アイコン + ラベル」構成の Button
- メニュー内のいずれかが現在地のとき、トリガーをアクティブ色で表示
  (暫定アイコンには bold 字形がないため色で代替。正式アイコン導入時に見直す)

## コンポーネント構成

```
src/lib/nav/overflowThresholds.ts   … しきい値の純関数 (テスト対象)
src/lib/nav/useOverflowCount.ts     … matchMedia 監視 hook
src/components/layout/navSections.tsx      … NAV_SECTIONS / MENU_NAV_SECTIONS
src/components/layout/NavOverflowMenu.tsx  … トリガー + Popover + Menu (新規)
src/components/layout/IconNav.tsx          … hide スタイル + NavOverflowMenu 組込み
src/components/layout/MobileBottomNav.tsx  … 同上 (幅ベース)
src/components/common/Icon.tsx             … menuDots 追加
src/components/common/Tooltip.tsx          … Tooltip 要素部を再利用可能に分離
```

## テスト

- `tests/lib/nav/overflowThresholds.test.ts` — 導出式の期待値 (168/224/280/336, 340/400/460/520)
- `tests/lib/nav/useOverflowCount.test.ts` — matchMedia モックでマッチ数と change 反映
- `tests/components/NavOverflowMenu.test.tsx` — メニュー開閉、Works リンク、
  アイコンなし項目のスロット描画、退避セクションの出現
- `tests/components/IconNav.test.tsx` — Works がメニュー経由になる分を更新
- 各ナビの media query const が純関数出力と一致することの検証

## 採用しなかった案

- **ResizeObserver / JS 計測でバー項目を隠す**: SSG の初期描画で崩れる
  (hydration までフル項目が出る)。項目数固定なら media query で十分
- **RouterProvider (react-aria) でのルーター統合**: TanStack 公式が
  `createLink` 方式を明記しており、こちらの方がアプリ全体への影響がない
- **メニュー項目も CSS で出し分け** (全項目を Menu に常時描画): react-aria の
  コレクションは display:none でもキーボード到達可能になり a11y を損なう
