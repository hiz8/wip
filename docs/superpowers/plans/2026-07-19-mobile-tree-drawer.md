# モバイル TreeSidebar ドロワー Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** モバイル表示 (`< 768px`) で、パンくずの先頭のアイコンボタンから左スライドインのドロワーを開き、`TreeSidebar` を表示して兄弟コンテンツへ遷移できるようにする。

**Architecture:** `AppShell` が `drawerOpen` 状態を持ち、`{ hasTree, open }` を React Context で子孫へ渡す。`Breadcrumb` / `BlogBreadcrumb` が Context を読み、モバイル限定トリガーをパンくず先頭に描画する。ドロワー本体は react-aria-components の `ModalOverlay`/`Modal`/`Dialog`（`SearchDialog` と同型）。同一ルートの兄弟遷移では `AppShell` が保持され `drawerOpen` が残るため、`useRouterState` のパス購読で自動クローズする。

**Tech Stack:** TanStack Start / React / react-aria-components 1.19.0 / StyleX 0.19.0 / Vitest + @testing-library

設計仕様: `docs/superpowers/specs/2026-07-19-mobile-tree-drawer-design.md`

## Global Constraints

- **ブレイクポイント**: モバイル = `< 768px`。CSS の media query は StyleX の順序制約により**同一ファイル内のフラットな文字列 const**で持つ: `const BP_TABLET = "@media (min-width: 768px)";`（`AppShell.tsx` / `DetailLayout.tsx` と同じ理由。ファイルまたぎの const は `var(--hash)` 化され順序が壊れる）
- **スタイリング**: StyleX のみ。インライン `style` 属性は使わない。トークンは `@/styles/tokens.stylex.ts`（`colors` / `space` / `radius` / `shadow` / `typography`）
- **react-aria-components**: モーダルは `ModalOverlay` + `Modal` + `Dialog`。`isDismissable` で範囲外クリック閉じ・Esc・フォーカストラップ・body スクロールロックが得られる（`SearchDialog.tsx` 準拠）
- **react-perf lint**: prop に渡す関数・オブジェクト・JSX は `useCallback`/`useMemo` で identity を安定させる
- **コメント言語**: 日本語。識別子・API 名・`// @vitest-environment jsdom` 等の機械可読ディレクティブは原表記。lint disable は理由を書く
- **テスト**: 先頭に `// @vitest-environment jsdom`。`@testing-library/react` + `@testing-library/user-event`、jest-dom matcher は `tests/setup.ts` で登録済み。TanStack のフック/リンクを使う対象は `createMemoryHistory` + `RouterProvider` ハーネスで描画。ナビ chrome（`IconNav`/`MobileBottomNav`）を含む描画は `vi.stubGlobal("matchMedia", …)` が必要
- **node 24 必須**: 既定 shell の node は v22。npm/npx コマンドは各行の先頭で `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH` を通してから実行する（通さないと engines で失敗）
- **コミット**: 実装前に `git switch -c feat/mobile-tree-drawer`（現在 `main`。デフォルトブランチへ直接コミットしない）。コミットメッセージは日本語・Conventional Commits 形式
- **fmt 注意**: `npm run fmt` は `docs/` の Markdown も整形する。コミット前に `git status` を確認し、無関係な `docs/` 差分は `git checkout` で戻す

---

### Task 1: panel-left アイコンを Icon に追加

**Files:**
- Modify: `src/components/common/Icon.tsx`
- Test: `tests/components/Icon.test.tsx`

**Interfaces:**
- Consumes: なし
- Produces: `IconType` に `"panelLeft"` を追加。`<Icon type="panelLeft" />` が描画可能になる

- [ ] **Step 1: 失敗するテストを書く**

`tests/components/Icon.test.tsx` の `TYPES` 配列に `"panelLeft"` を追加する（既存の描画テスト・distinct class テストが panelLeft も対象にする）。

```tsx
const TYPES: readonly IconType[] = [
  "home",
  "homeBold",
  "github",
  "global",
  "works",
  "blog",
  "notebook",
  "notebookBold",
  "notes",
  "notesBold",
  "book",
  "bookBold",
  "externalLink",
  "search",
  "sun",
  "moon",
  "panelLeft",
];
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/Icon.test.tsx`
Expected: FAIL（`panelLeft` が `IconType` に無く型エラー、または `TYPE_STYLES[type]` が undefined でクラスが得られず distinct class の Set サイズが合わない）

- [ ] **Step 3: Icon.tsx にアイコンを実装**

3-1. `IconType` union（先頭付近）に `panelLeft` を追加:

```tsx
  | "menuDots"
  | "panelLeft";
```

3-2. mask 定数を他の `*_MASK` 定数群（`MENU_DOTS_MASK` の近く）に追加。自作の 24×24 ストロークアイコン（角丸矩形＋左仕切り線）で、`currentColor` 着色・1.5 stroke と既存セットに揃える:

```tsx
// 左サイドバー/ツリーを開くトリガー用。角丸パネル + 左仕切り線の自作アイコン
// (既存の Solar 素材と stroke-width 1.5 / currentColor を揃える)。
const PANEL_LEFT_MASK =
  "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZyBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxyZWN0IHg9IjMiIHk9IjQiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxNiIgcng9IjIiLz48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIGQ9Ik05IDR2MTYiLz48L2c+PC9zdmc+)";
```

3-3. `stylex.create({...})` 内、`typeMenuDots` の後に追加:

```tsx
  typeMenuDots: { "::before": { maskImage: MENU_DOTS_MASK } },
  typePanelLeft: { "::before": { maskImage: PANEL_LEFT_MASK } },
```

3-4. `TYPE_STYLES` マップ、`menuDots` の後に追加:

```tsx
  menuDots: styles.typeMenuDots,
  panelLeft: styles.typePanelLeft,
```

- [ ] **Step 4: テストが通ることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/Icon.test.tsx`
Expected: PASS（全 `TYPES` について span 描画・distinct class）

- [ ] **Step 5: 型チェック**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run typecheck`
Expected: エラーなし

- [ ] **Step 6: コミット**

```bash
git add src/components/common/Icon.tsx tests/components/Icon.test.tsx
git commit -m "feat: Icon に panelLeft アイコンを追加"
```

---

### Task 2: TreeDrawerContext とトリガーボタン

**Files:**
- Create: `src/components/layout/TreeDrawerContext.tsx`
- Create: `src/components/layout/TreeDrawerTrigger.tsx`
- Test: `tests/components/TreeDrawerTrigger.test.tsx`

**Interfaces:**
- Consumes: `<Icon type="panelLeft" />`（Task 1）、`a11y.srOnly`（`@/styles/a11y.ts`）
- Produces:
  - `TreeDrawerContext`（`React.Context<TreeDrawerContextValue>`）、`TreeDrawerContextValue = { hasTree: boolean; open: () => void }`、デフォルト `{ hasTree: false, open: () => {} }`
  - `useTreeDrawer(): TreeDrawerContextValue`
  - `<TreeDrawerTrigger />`（props なし。`hasTree` が false のとき `null`。true のとき `<button aria-label="コンテンツツリーを開く">`、クリックで `open()`）

- [ ] **Step 1: 失敗するテストを書く**

`tests/components/TreeDrawerTrigger.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import {
  TreeDrawerContext,
  type TreeDrawerContextValue,
} from "@/components/layout/TreeDrawerContext.tsx";
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";

function renderWithContext(value: TreeDrawerContextValue, ui: ReactNode) {
  return render(<TreeDrawerContext.Provider value={value}>{ui}</TreeDrawerContext.Provider>);
}

describe("TreeDrawerTrigger", () => {
  it("hasTree が false のとき何も描画しない", () => {
    renderWithContext({ hasTree: false, open: () => {} }, <TreeDrawerTrigger />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("hasTree が true のときボタンを描画し、クリックで open を呼ぶ", async () => {
    const open = vi.fn();
    const user = userEvent.setup();
    renderWithContext({ hasTree: true, open }, <TreeDrawerTrigger />);
    const button = screen.getByRole("button", { name: "コンテンツツリーを開く" });
    await user.click(button);
    expect(open).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/TreeDrawerTrigger.test.tsx`
Expected: FAIL（モジュール未作成で import 解決不可）

- [ ] **Step 3: Context を実装**

`src/components/layout/TreeDrawerContext.tsx`:

```tsx
import { createContext, useContext } from "react";

export interface TreeDrawerContextValue {
  hasTree: boolean;
  open: () => void;
}

const noop = () => {};

// ツリードロワーの開閉をパンくず先頭のトリガー (本文内) と AppShell (ドロワー本体) の
// 間で橋渡しする。Provider を持たないツリーで描画された場合は hasTree=false でトリガー非表示。
export const TreeDrawerContext = createContext<TreeDrawerContextValue>({
  hasTree: false,
  open: noop,
});

export function useTreeDrawer(): TreeDrawerContextValue {
  return useContext(TreeDrawerContext);
}
```

- [ ] **Step 4: トリガーを実装**

`src/components/layout/TreeDrawerTrigger.tsx`:

```tsx
import * as stylex from "@stylexjs/stylex";
import { colors, radius } from "@/styles/tokens.stylex.ts";
import { a11y } from "@/styles/a11y.ts";
import { Icon } from "@/components/common/Icon.tsx";
import { useTreeDrawer } from "./TreeDrawerContext.tsx";

// StyleX の media-query 順序制約により同一ファイルのフラット文字列 const にする
// (AppShell.tsx の BP_TABLET と同じ理由)。
const BP_TABLET = "@media (min-width: 768px)";

const styles = stylex.create({
  button: {
    display: { default: "inline-flex", [BP_TABLET]: "none" },
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
    padding: 0,
    borderStyle: "none",
    borderRadius: radius.sm,
    color: { default: colors.textMuted, ":hover": colors.link },
    backgroundColor: { default: "transparent", ":hover": colors.hoverBg },
    cursor: "pointer",
    flexShrink: 0,
  },
});

// モバイル (< 768px) 限定。パンくずの先頭に置き、クリックでツリードロワーを開く。
// ツリーを持たないページ (hasTree=false) では描画しない。
export function TreeDrawerTrigger() {
  const { hasTree, open } = useTreeDrawer();
  if (!hasTree) return null;
  return (
    <button
      type="button"
      onClick={open}
      aria-label="コンテンツツリーを開く"
      {...stylex.props(styles.button)}
    >
      <Icon type="panelLeft" size={20} />
      <span {...stylex.props(a11y.srOnly)}>コンテンツツリーを開く</span>
    </button>
  );
}
```

- [ ] **Step 5: テストが通ることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/TreeDrawerTrigger.test.tsx`
Expected: PASS（2 件）

- [ ] **Step 6: コミット**

```bash
git add src/components/layout/TreeDrawerContext.tsx src/components/layout/TreeDrawerTrigger.tsx tests/components/TreeDrawerTrigger.test.tsx
git commit -m "feat: ツリードロワーの Context とトリガーボタンを追加"
```

---

### Task 3: TreeDrawer 本体（左スライドインのモーダル）

**Files:**
- Create: `src/components/layout/TreeDrawer.tsx`
- Test: `tests/components/TreeDrawer.test.tsx`

**Interfaces:**
- Consumes: react-aria-components の `ModalOverlay` / `Modal` / `Dialog`
- Produces: `<TreeDrawer isOpen={boolean} onOpenChange={(open: boolean) => void}>{children}</TreeDrawer>`。開いている間だけ `role="dialog"`（`aria-label="コンテンツツリー"`）と children を描画

- [ ] **Step 1: 失敗するテストを書く**

`tests/components/TreeDrawer.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { TreeDrawer } from "@/components/layout/TreeDrawer.tsx";

const noop = () => {};

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        open
      </button>
      <TreeDrawer isOpen={open} onOpenChange={setOpen}>
        <div>tree content</div>
      </TreeDrawer>
    </>
  );
}

describe("TreeDrawer", () => {
  it("閉じているときは dialog を描画しない", () => {
    render(
      <TreeDrawer isOpen={false} onOpenChange={noop}>
        <div>tree content</div>
      </TreeDrawer>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("開いているときラベル付き dialog と children を描画する", () => {
    render(
      <TreeDrawer isOpen onOpenChange={noop}>
        <div>tree content</div>
      </TreeDrawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "コンテンツツリー" });
    expect(within(dialog).getByText("tree content")).toBeInTheDocument();
  });

  it("Escape で閉じる", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/TreeDrawer.test.tsx`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: TreeDrawer を実装**

`src/components/layout/TreeDrawer.tsx`:

```tsx
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { colors, shadow } from "@/styles/tokens.stylex.ts";

interface TreeDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

// ModalOverlay は isOpen=false のとき children を mount しないため、この keyframe は
// 「開くたびの mount 時」にのみ再生される (閉じるアニメーションは持たない)。
const slideIn = stylex.keyframes({
  from: { transform: "translateX(-100%)" },
  to: { transform: "translateX(0)" },
});

const styles = stylex.create({
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 1000,
  },
  modal: {
    position: "fixed",
    insetBlock: 0,
    insetInlineStart: 0,
    width: "16rem",
    maxWidth: "80vw",
    height: "100vh",
    backgroundColor: colors.bgSurface,
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: colors.borderSubtle,
    boxShadow: shadow.lg,
    overflowY: "auto",
    animationName: slideIn,
    animationDuration: "180ms",
    animationTimingFunction: "ease-out",
  },
  dialog: {
    outline: "none",
    minHeight: "100%",
  },
});

// モバイル用 TreeSidebar ドロワー。範囲外クリック / Esc で閉じる (isDismissable)。
// フォーカストラップ・body スクロールロックは react-aria-components が担う。
export function TreeDrawer({ isOpen, onOpenChange, children }: TreeDrawerProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      {...stylex.props(styles.overlay)}
    >
      <Modal {...stylex.props(styles.modal)}>
        <Dialog aria-label="コンテンツツリー" {...stylex.props(styles.dialog)}>
          {children}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/TreeDrawer.test.tsx`
Expected: PASS（3 件）

- [ ] **Step 5: コミット**

```bash
git add src/components/layout/TreeDrawer.tsx tests/components/TreeDrawer.test.tsx
git commit -m "feat: 左スライドインの TreeDrawer を追加"
```

---

### Task 4: 遷移時クローズ用フック useCloseOnNavigate

**Files:**
- Create: `src/components/layout/useCloseOnNavigate.ts`
- Test: `tests/components/useCloseOnNavigate.test.tsx`

**Interfaces:**
- Consumes: `useRouterState`（`@tanstack/react-router`）
- Produces: `useCloseOnNavigate(close: () => void): void`。`location.pathname` が変わるたびに `close()` を呼ぶ（`close` は呼び出し側で `useCallback` により安定させる前提）。mount 時にも 1 度呼ばれる（その時点でドロワーは閉じているため無害）

設計仕様 section 5 の `useRouterState` ロジックを、テスト容易性のためフックへ抽出したもの。同一ルートの兄弟遷移（例 `/notes/a` → `/notes/b`）では `AppShell` が保持され `drawerOpen` が残るため必要。

- [ ] **Step 1: 失敗するテストを書く**

`tests/components/useCloseOnNavigate.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";
import { useCloseOnNavigate } from "@/components/layout/useCloseOnNavigate.ts";

function makeRouter(close: () => void) {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const itemRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/item/$id",
    component: function ItemPage() {
      useCloseOnNavigate(close);
      const navigate = useNavigate();
      return (
        <button
          type="button"
          onClick={() => navigate({ to: "/item/$id", params: { id: "2" } })}
        >
          go
        </button>
      );
    },
  });
  return createRouter({
    routeTree: rootRoute.addChildren([itemRoute]),
    history: createMemoryHistory({ initialEntries: ["/item/1"] }),
  });
}

describe("useCloseOnNavigate", () => {
  it("同一ルートの兄弟遷移でパスが変わると close を呼ぶ", async () => {
    const close = vi.fn();
    const user = userEvent.setup();
    render(<RouterProvider router={makeRouter(close)} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "go" })).toBeInTheDocument());
    const callsAfterMount = close.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(close.mock.calls.length).toBeGreaterThan(callsAfterMount));
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/useCloseOnNavigate.test.tsx`
Expected: FAIL（モジュール未作成）

- [ ] **Step 3: フックを実装**

`src/components/layout/useCloseOnNavigate.ts`:

```tsx
import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

// パスが変わるたびに close() を呼ぶ。同一ルートの兄弟遷移 (例 /notes/a → /notes/b) では
// AppShell が保持され drawerOpen が残るため、明示的に閉じる必要がある。
// close は呼び出し側で安定 (useCallback) させる。mount 時にも 1 度呼ばれるが、その時点では
// ドロワーは閉じているため無害。
export function useCloseOnNavigate(close: () => void): void {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  useEffect(() => {
    close();
  }, [pathname, close]);
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/useCloseOnNavigate.test.tsx`
Expected: PASS（1 件）

- [ ] **Step 5: コミット**

```bash
git add src/components/layout/useCloseOnNavigate.ts tests/components/useCloseOnNavigate.test.tsx
git commit -m "feat: 遷移時にドロワーを閉じる useCloseOnNavigate を追加"
```

---

### Task 5: AppShell に状態・Provider・ドロワーを配線

**Files:**
- Modify: `src/components/layout/AppShell.tsx`
- Test: `tests/components/AppShell.test.tsx`

**Interfaces:**
- Consumes: `TreeDrawerContext`（Task 2）、`TreeDrawer`（Task 3）、`useCloseOnNavigate`（Task 4）、`TreeDrawerTrigger`（テストのみ、Task 2）
- Produces: `AppShell` が `showTree` のとき Context を `{ hasTree: true, open }` で提供し、`<TreeDrawer>` に `treeSidebar` を描画。トリガー押下でドロワーが開き `treeSidebar` を表示する

- [ ] **Step 1: 失敗する統合テストを書く**

`tests/components/AppShell.test.tsx`（`IconNav.test.tsx` と同じ matchMedia / pagefind モック方式）:

```tsx
// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function MockPagefindUI() {
  // 何もしない
}
vi.mock("/pagefind/pagefind-ui.js", () => ({ PagefindUI: MockPagefindUI }));

import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";

function installMatchMedia() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "",
      addEventListener: () => {},
      removeEventListener: () => {},
    })),
  );
}

function renderShell() {
  const rootRoute = createRootRoute({ component: () => <Outlet /> });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
      <AppShell variant="list" treeSidebar={<div>TREE ITEMS</div>}>
        <TreeDrawerTrigger />
      </AppShell>
    ),
  });
  const make = (p: string) =>
    createRoute({ getParentRoute: () => rootRoute, path: p, component: () => null });
  const router = createRouter({
    routeTree: rootRoute.addChildren([
      indexRoute,
      make("/notes"),
      make("/glossary"),
      make("/books"),
      make("/blog"),
      make("/works"),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("AppShell tree drawer", () => {
  beforeEach(() => {
    installMatchMedia();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("トリガー押下でドロワーが開き treeSidebar を表示する", async () => {
    const user = userEvent.setup();
    renderShell();
    const trigger = await screen.findByRole("button", { name: "コンテンツツリーを開く" });
    expect(screen.queryByRole("dialog", { name: "コンテンツツリー" })).toBeNull();
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", { name: "コンテンツツリー" });
    expect(within(dialog).getByText("TREE ITEMS")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/AppShell.test.tsx`
Expected: FAIL（`AppShell` がまだ Context / トリガー / ドロワーを提供しないため、トリガーボタンが見つからない）

- [ ] **Step 3: AppShell を実装**

3-1. import を差し替え（`react` から `useCallback, useMemo, useState` を追加、新規モジュールを import）:

```tsx
import * as stylex from "@stylexjs/stylex";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { IconNav } from "./IconNav.tsx";
import { MobileTopBar } from "./MobileTopBar.tsx";
import { MobileBottomNav } from "./MobileBottomNav.tsx";
import { TreeDrawer } from "./TreeDrawer.tsx";
import { TreeDrawerContext } from "./TreeDrawerContext.tsx";
import { useCloseOnNavigate } from "./useCloseOnNavigate.ts";
```

3-2. `AppShell` 関数本体を差し替え（`styles` 定義はそのまま）:

```tsx
export function AppShell({ variant, treeSidebar, rightSidebar, children }: AppShellProps) {
  const showTree = variant !== "home" && treeSidebar !== undefined;
  const showRight = variant === "detail" && rightSidebar !== undefined;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  useCloseOnNavigate(closeDrawer);
  const drawerContext = useMemo(
    () => ({ hasTree: showTree, open: openDrawer }),
    [showTree, openDrawer],
  );

  return (
    <TreeDrawerContext.Provider value={drawerContext}>
      <div {...stylex.props(styles.root)}>
        <IconNav />
        <MobileTopBar />
        <div
          {...stylex.props(
            styles.body,
            showRight ? styles.bodyWithRight : showTree ? styles.bodyWithTree : null,
          )}
        >
          {showTree ? <aside {...stylex.props(styles.treeArea)}>{treeSidebar}</aside> : null}
          <div {...stylex.props(styles.mainArea, variant === "home" && styles.mainAreaHome)}>
            {children}
          </div>
          {showRight ? <aside {...stylex.props(styles.rightArea)}>{rightSidebar}</aside> : null}
        </div>
        <MobileBottomNav />
        {showTree ? (
          <TreeDrawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
            {treeSidebar}
          </TreeDrawer>
        ) : null}
      </div>
    </TreeDrawerContext.Provider>
  );
}
```

> 注: `treeSidebar` ノードはデスクトップ `<aside>` とドロワーの両方に置くが、`ModalOverlay` は `isOpen=false` の間 children を mount しないため、閉じている間はドロワー側インスタンスは生成されない。

- [ ] **Step 4: テストが通ることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/AppShell.test.tsx`
Expected: PASS（1 件）

- [ ] **Step 5: 既存のレイアウト系テストに回帰がないことを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/IconNav.test.tsx tests/components/TreeSidebar.test.tsx tests/components/DetailLayout.test.tsx`
Expected: すべて PASS

- [ ] **Step 6: 型チェック**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run typecheck`
Expected: エラーなし

- [ ] **Step 7: コミット**

```bash
git add src/components/layout/AppShell.tsx tests/components/AppShell.test.tsx
git commit -m "feat: AppShell にツリードロワーの状態と Provider を配線"
```

---

### Task 6: パンくず先頭にトリガーを配置（Breadcrumb / BlogBreadcrumb）

**Files:**
- Modify: `src/components/common/Breadcrumb.tsx`
- Modify: `src/components/blog/BlogBreadcrumb.tsx`
- Test: `tests/components/Breadcrumb.test.tsx`（既存に追記）
- Test: `tests/components/BlogBreadcrumb.test.tsx`（新規）

**Interfaces:**
- Consumes: `<TreeDrawerTrigger />`（Task 2）、`TreeDrawerContext`（テスト用）
- Produces: `Breadcrumb` / `BlogBreadcrumb` が `<nav>` の先頭（`<Breadcrumbs>` = `ol` の前）にトリガーを描画。トリガーはボタンなので `ol` の外に置きセマンティクスを保つ

- [ ] **Step 1: 失敗するテストを書く（Breadcrumb 追記）**

`tests/components/Breadcrumb.test.tsx` の先頭の import に追加:

```tsx
import { waitFor } from "@testing-library/react";
import { TreeDrawerContext } from "@/components/layout/TreeDrawerContext.tsx";
```

（既存の `import { render, screen, waitFor } from "@testing-library/react";` に `waitFor` が含まれていればそのまま。含まれない場合のみ補う。）

`describe("Breadcrumb", …)` 内に追記:

```tsx
  it("ツリーがある (hasTree=true) とき、crumbs の前にトリガーを描画する", async () => {
    renderWithRouter(
      <TreeDrawerContext.Provider value={{ hasTree: true, open: () => {} }}>
        <Breadcrumb rootLabel="Notes" rootTo="/notes" current="x" />
      </TreeDrawerContext.Provider>,
    );
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    const trigger = screen.getByRole("button", { name: "コンテンツツリーを開く" });
    const ol = screen.getByRole("navigation").querySelector("ol");
    expect(ol).not.toBeNull();
    // トリガーは ol より前 (先頭) にある。
    expect(
      trigger.compareDocumentPosition(ol as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("Provider が無い (hasTree=false) 既定ではトリガーを描画しない", async () => {
    renderWithRouter(<Breadcrumb rootLabel="Notes" rootTo="/notes" current="x" />);
    await waitFor(() => expect(screen.getByRole("navigation")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "コンテンツツリーを開く" })).toBeNull();
  });
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/Breadcrumb.test.tsx`
Expected: 追記した「トリガーを描画する」テストが FAIL（`Breadcrumb` がまだトリガーを描画しない）。既存テストは PASS

- [ ] **Step 3: Breadcrumb を実装**

3-1. import 追加:

```tsx
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";
```

3-2. `styles.nav` を flex 行にする:

```tsx
  nav: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    marginBottom: space.s5,
  },
```

3-3. `return` の `<nav>` 先頭にトリガーを追加:

```tsx
  return (
    <nav aria-label="パンくず" {...stylex.props(styles.nav)}>
      <TreeDrawerTrigger />
      <Breadcrumbs {...stylex.props(styles.crumbs)}>
        {/* 既存の中身はそのまま */}
      </Breadcrumbs>
    </nav>
  );
```

- [ ] **Step 4: Breadcrumb テストが通ることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/Breadcrumb.test.tsx`
Expected: すべて PASS（既存 3 件 + 追記 2 件）

- [ ] **Step 5: 失敗するテストを書く（BlogBreadcrumb 新規）**

`tests/components/BlogBreadcrumb.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TreeDrawerContext } from "@/components/layout/TreeDrawerContext.tsx";
import { BlogBreadcrumb } from "@/components/blog/BlogBreadcrumb.tsx";

describe("BlogBreadcrumb", () => {
  it("ツリーがある (hasTree=true) とき、crumbs の前にトリガーを描画する", () => {
    render(
      <TreeDrawerContext.Provider value={{ hasTree: true, open: () => {} }}>
        <BlogBreadcrumb items={[]} />
      </TreeDrawerContext.Provider>,
    );
    const trigger = screen.getByRole("button", { name: "コンテンツツリーを開く" });
    const ol = screen.getByRole("navigation").querySelector("ol");
    expect(ol).not.toBeNull();
    expect(
      trigger.compareDocumentPosition(ol as Node) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("既定 (hasTree=false) ではトリガーを描画しない", () => {
    render(<BlogBreadcrumb items={[]} />);
    expect(screen.queryByRole("button", { name: "コンテンツツリーを開く" })).toBeNull();
  });
});
```

> `items={[]}` のとき先頭 "Blog" は `<span>`（Link 非描画）なので router ハーネスは不要。

- [ ] **Step 6: テストが失敗することを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/BlogBreadcrumb.test.tsx`
Expected: 「トリガーを描画する」が FAIL

- [ ] **Step 7: BlogBreadcrumb を実装**

7-1. import 追加:

```tsx
import { TreeDrawerTrigger } from "@/components/layout/TreeDrawerTrigger.tsx";
```

7-2. `styles.nav` を flex 行にする:

```tsx
  nav: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    marginBottom: space.s4,
  },
```

7-3. `return` の `<nav>` 先頭にトリガーを追加:

```tsx
  return (
    <nav aria-label="Breadcrumb" {...stylex.props(styles.nav)}>
      <TreeDrawerTrigger />
      <Breadcrumbs {...stylex.props(styles.crumbs)}>
        {/* 既存の中身はそのまま */}
      </Breadcrumbs>
    </nav>
  );
```

- [ ] **Step 8: BlogBreadcrumb テストが通ることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run test -- tests/components/BlogBreadcrumb.test.tsx`
Expected: すべて PASS（2 件）

- [ ] **Step 9: 型チェック**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run typecheck`
Expected: エラーなし

- [ ] **Step 10: コミット**

```bash
git add src/components/common/Breadcrumb.tsx src/components/blog/BlogBreadcrumb.tsx tests/components/Breadcrumb.test.tsx tests/components/BlogBreadcrumb.test.tsx
git commit -m "feat: パンくずの先頭にツリードロワーのトリガーを配置"
```

---

### Task 7: Storybook ストーリーと最終検証

**Files:**
- Create: `src/components/layout/TreeDrawer.stories.tsx`

**Interfaces:**
- Consumes: `TreeDrawer`（Task 3）
- Produces: Storybook で TreeDrawer の開閉を確認できるストーリー（Vault 不要のダミー内容）

- [ ] **Step 1: ストーリーを作成**

`src/components/layout/TreeDrawer.stories.tsx`:

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { TreeDrawer } from "./TreeDrawer.tsx";

const meta = {
  title: "layout/TreeDrawer",
  component: TreeDrawer,
} satisfies Meta<typeof TreeDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open drawer
      </button>
      <TreeDrawer isOpen={open} onOpenChange={setOpen}>
        <nav aria-label="サンプルツリー">
          <ul>
            <li>フォルダ A</li>
            <li>フォルダ B</li>
            <li>ノート 1</li>
            <li>ノート 2</li>
          </ul>
        </nav>
      </TreeDrawer>
    </>
  );
}

/** ボタンで開閉。範囲外クリック / Esc で閉じる。 */
export const Default: Story = { render: () => <Demo /> };
```

- [ ] **Step 2: Storybook がビルドできることを確認**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run storybook:build`
Expected: エラーなくビルド完了（`storybook-static/` 生成）

- [ ] **Step 3: 全テスト・型・lint の最終検証**

Run: `export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH && npm run typecheck && npm run test && npm run lint`
Expected: typecheck エラーなし / 全テスト PASS / lint エラーなし

- [ ] **Step 4: 実ブラウザでの手動確認（推奨）**

`fixtures/vault` を使えば NAS 上の Vault なしで実挙動を確認できる（sandbox 無効化が必要）。

Run:
```bash
export PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH
VAULT_ROOT=tests/fixtures/vault npm run build && VAULT_ROOT=tests/fixtures/vault npm run preview
```
確認項目（ブラウザの devtools で幅を `< 768px` にする）:
- Notes/Glossary/Books の詳細・一覧・タグ、Blog 一覧・タグでパンくず先頭に panel-left アイコンが出る
- クリックで左からドロワーがスライドインし TreeSidebar が表示される
- 範囲外クリック / Esc で閉じる
- ツリー内のノートをタップすると遷移し、遷移先でドロワーが閉じている
- `≥ 768px` ではトリガーが消え、従来どおり左カラムにツリーが常時表示される

- [ ] **Step 5: fmt の巻き込み確認とコミット**

`npm run fmt` を実行する場合は `docs/` の無関係な差分に注意（`git status` で確認し、無関係なら `git checkout -- docs/` で戻す）。

```bash
git add src/components/layout/TreeDrawer.stories.tsx
git commit -m "feat: TreeDrawer の Storybook ストーリーを追加"
```

---

## Self-Review

**1. Spec coverage（設計仕様の各項目 → タスク対応）**

- パンくず先頭のモバイル限定トリガー → Task 1（アイコン）+ Task 2（トリガー）+ Task 6（配置）
- 左からドロワー表示・範囲外クリックで閉じる → Task 3（`TreeDrawer` + `isDismissable` + スライドイン）
- 対象「ツリーを持つ全ページ」→ Task 5（`AppShell` 一元化）+ Task 6（Breadcrumb / BlogBreadcrumb 両系統）
- 状態は AppShell + Context → Task 2（Context）+ Task 5（Provider）
- 遷移時クローズ → Task 4（`useCloseOnNavigate`）+ Task 5（配線）
- panel-left アイコン新規追加 → Task 1
- テスト（開閉・トリガー出し分け・遷移時クローズ・Storybook）→ Task 2–7
- レスポンシブ（`< 768px` 限定表示）→ Task 2（`BP_TABLET` の CSS 出し分け）

**2. Placeholder scan:** 各コード step は実コードを含む。TBD/TODO なし。

**3. Type consistency:** `TreeDrawerContextValue = { hasTree: boolean; open: () => void }` を Task 2 で定義し、Task 5（Provider の value）・Task 6/テスト（Provider）で同一形状を使用。`TreeDrawer` の props（`isOpen` / `onOpenChange` / `children`）は Task 3 定義と Task 5 呼び出しで一致。`useCloseOnNavigate(close: () => void)` は Task 4 定義と Task 5 呼び出しで一致。`Icon` の `panelLeft` は Task 1 追加、Task 2 で使用。

**4. 対象外（設計仕様の将来拡張）:** 開状態での `≥ 768px` リサイズ時の自動クローズ、スライドインの作り込みは本計画では扱わない。
