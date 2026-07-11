# Works ページ移植 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** hiz.blue の `/works` ページを本リポジトリへ移植し、ナビ導線・ルート・カード・静的画像・データを追加する。

**Architecture:** Obsidian 非依存のリポジトリ内完結ページとして `/works` を追加する。データは `src/lib/works/data.ts` の静的配列、表示は `src/components/works/WorksCard.tsx`、ルートは `src/routes/works/index.tsx`。ナビは `NAV_SECTIONS` を 1 エントリ拡張するだけで IconNav / MobileBottomNav に自動反映される。

**Tech Stack:** TypeScript (strict), TanStack Start (SSG), React 19, StyleX, react-aria-components, Vitest + Testing Library。

## Global Constraints

- TypeScript `strict: true` + `noUncheckedIndexedAccess`。`any` 禁止 (やむを得ない場合は理由コメント)。
- スタイリングは StyleX のみ。`style` 属性・インラインスタイル禁止。トークンは `@/styles/tokens.stylex.ts` から取得する。
- routes/ には**ルートファイルのみ**を置く。カード component は `src/components/works/`、データは `src/lib/works/` に置く。
- 外部リンクは `target="_blank" rel="noreferrer"`。
- ナビは `src/components/layout/navSections.tsx` の `NAV_SECTIONS` から自動描画される (IconNav / MobileBottomNav は変更不要)。
- コード内コメントは日本語。識別子・属性名・URL・機械可読ディレクティブは原表記。
- 静的画像は `public/images/` に置き `/images/<name>` で参照する。
- コミットメッセージは Conventional Commits・日本語

---

## File Structure

- Create: `public/images/icon-ruby-blue-theme.png` (hiz.blue からコピー)
- Create: `public/images/icon-airbeat.svg` (コピー)
- Create: `public/images/icon-gijione.svg` (コピー)
- Create: `public/images/icon-cinemasaurus.svg` (コピー)
- Create: `src/lib/works/data.ts` — `Work` 型 + `WORKS` / `ARCHIVED` 静的データ
- Create: `tests/lib/works/data.test.ts` — データ整合 (画像実在・URL 妥当) テスト
- Create: `src/components/works/WorksCard.tsx` — 1 プロジェクトのカード表示
- Create: `tests/components/works/WorksCard.test.tsx` — カードの render テスト
- Create: `src/routes/works/index.tsx` — `/works` ルート
- Modify: `src/components/layout/navSections.tsx` — `to` union + `NAV_SECTIONS` に Works 追加
- Modify: `tests/components/IconNav.test.tsx` — routeTree に `/works` 追加 + Works 導線テスト

---

## Task 1: Works データと静的画像

**Files:**

- Create: `src/lib/works/data.ts`
- Create: `tests/lib/works/data.test.ts`
- Copy: `public/images/icon-ruby-blue-theme.png`, `icon-airbeat.svg`, `icon-gijione.svg`, `icon-cinemasaurus.svg`

**Interfaces:**

- Produces: `interface Work { title: string; description: string; image?: string; urls: { type: "website" | "github"; url: string }[] }`
- Produces: `export const WORKS: Work[]` / `export const ARCHIVED: Work[]`

- [ ] **Step 1: テストを書く (失敗する)**

`tests/lib/works/data.test.ts`:

```ts
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCHIVED, WORKS, type Work } from "@/lib/works/data.ts";

const ALL: Work[] = [...WORKS, ...ARCHIVED];

describe("lib/works data", () => {
  it("WORKS と ARCHIVED を非空で公開する", () => {
    expect(WORKS.length).toBeGreaterThan(0);
    expect(ARCHIVED.length).toBeGreaterThan(0);
  });

  it("各エントリは title / description / 非空の urls を持つ", () => {
    for (const work of ALL) {
      expect(work.title.length).toBeGreaterThan(0);
      expect(work.description.length).toBeGreaterThan(0);
      expect(work.urls.length).toBeGreaterThan(0);
      for (const { type, url } of work.urls) {
        expect(["website", "github"]).toContain(type);
        expect(url).toMatch(/^https?:\/\//u);
      }
    }
  });

  it("image を持つエントリはファイルが public/ に実在する", () => {
    for (const work of ALL) {
      if (work.image === undefined) continue;
      const abs = join(process.cwd(), "public", work.image.replace(/^\//u, ""));
      expect(existsSync(abs), `missing image: ${work.image}`).toBe(true);
    }
  });

  it("title は WORKS + ARCHIVED を通して一意 (key 用途)", () => {
    const titles = ALL.map((w) => w.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm run test -- tests/lib/works/data.test.ts`
Expected: FAIL (`Failed to resolve import "@/lib/works/data.ts"`)

- [ ] **Step 3: 画像をコピーする**

Run:

```bash
mkdir -p /home/hiz/work/wip/public/images
cp /home/hiz/work/hiz.blue/public/images/icon-ruby-blue-theme.png /home/hiz/work/wip/public/images/
cp /home/hiz/work/hiz.blue/public/images/icon-airbeat.svg /home/hiz/work/wip/public/images/
cp /home/hiz/work/hiz.blue/public/images/icon-gijione.svg /home/hiz/work/wip/public/images/
cp /home/hiz/work/hiz.blue/public/images/icon-cinemasaurus.svg /home/hiz/work/wip/public/images/
```

- [ ] **Step 4: データモジュールを作る**

`src/lib/works/data.ts`:

```ts
// hiz.blue の /works ページから移植した静的プロジェクト一覧。Obsidian Vault を
// 情報源とせず、このリポジトリ内で完結する。表示順 (降順) で直書きし、runtime の
// ソートは行わない。
export interface Work {
  title: string;
  description: string;
  image?: string;
  urls: { type: "website" | "github"; url: string }[];
}

export const WORKS: Work[] = [
  {
    title: "Cinemasaurus",
    description: "沖縄県内の映画情報サイト",
    image: "/images/icon-cinemasaurus.svg",
    urls: [{ type: "website", url: "https://cinemasaurus.net/" }],
  },
  {
    title: "Giji one",
    description: "A tool for the assistance of people in the creation of meeting minutes.",
    image: "/images/icon-gijione.svg",
    urls: [
      { type: "website", url: "https://gijione.hizapp.blue/" },
      { type: "github", url: "https://github.com/hiz8/giji-one" },
    ],
  },
  {
    title: "airbeat",
    description: "Offline first metronome application.",
    image: "/images/icon-airbeat.svg",
    urls: [
      { type: "website", url: "https://airbeat.hizapp.blue/" },
      { type: "github", url: "https://github.com/hiz8/airbeat" },
    ],
  },
  {
    title: "Noto Serif CJK JP min",
    description: "Subset of the Noto Serif CJK JP for the size down.",
    urls: [
      { type: "website", url: "https://hiz8.github.io/Noto-Serif-CJK-JP.min/" },
      { type: "github", url: "https://github.com/hiz8/Noto-Serif-CJK-JP.min" },
    ],
  },
  {
    title: "Noto Sans CJK JP min",
    description: "Subset of the Noto Sans CJK JP for the size down.",
    urls: [
      { type: "website", url: "https://hiz8.github.io/Noto-Sans-CJK-JP.min/" },
      { type: "github", url: "https://github.com/hiz8/Noto-Sans-CJK-JP.min" },
    ],
  },
  {
    title: "VS Code Ruby Blue Theme",
    description: "Dark, high contrast theme for VS Code.",
    image: "/images/icon-ruby-blue-theme.png",
    urls: [
      {
        type: "website",
        url: "https://marketplace.visualstudio.com/items?itemName=hirofumii.rubyblue-theme",
      },
      { type: "github", url: "https://github.com/hiz8/vscode-theme-rubyblue" },
    ],
  },
];

export const ARCHIVED: Work[] = [
  {
    title: "Spectacle Boilerplate SWC",
    description: "Spectacle Boilerplate based on SWC for high speed.",
    urls: [
      {
        type: "website",
        url: "https://hiz8.github.io/spectacle-presentation-swc/",
      },
      {
        type: "github",
        url: "https://github.com/hiz8/spectacle-presentation-swc",
      },
    ],
  },
  {
    title: "hexo-theme-amp",
    description: "A simple and mobile first Hexo template on AMP ⚡ HTML.",
    urls: [
      { type: "website", url: "https://hiz8.github.io/hexo-theme-amp/" },
      { type: "github", url: "https://github.com/hiz8/hexo-theme-amp" },
    ],
  },
  {
    title: "Playground",
    description: "Playground for Future of Web Technology.",
    urls: [
      { type: "website", url: "https://ground.plyrs.net/" },
      { type: "github", url: "https://github.com/plyrs/plyground" },
    ],
  },
  {
    title: "Playlog",
    description: "Webフロントエンドについて徒然と",
    urls: [
      { type: "website", url: "https://log.plyrs.net/" },
      { type: "github", url: "https://github.com/plyrs/plylog" },
    ],
  },
  {
    title: "宜野湾 HUMAN STAGE",
    description: "宜野湾 HUMAN STAGE の公式ウェブサイト",
    urls: [{ type: "website", url: "https://www.humanstage.net/" }],
  },
  {
    title: "NAUTILUS OFFICIAL WEBSITE",
    description: "NAUTILUS の公式ウェブサイト",
    urls: [{ type: "website", url: "https://nautilus-jp.com/" }],
  },
];
```

- [ ] **Step 5: テストを実行して成功を確認する**

Run: `npm run test -- tests/lib/works/data.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 6: コミット**

```bash
git add public/images src/lib/works/data.ts tests/lib/works/data.test.ts
git commit -F - <<'EOF'
feat(works): プロジェクト一覧の静的データと画像を追加

hiz.blue の /works から WORKS / ARCHIVED を忠実移植し、プロジェクト
アイコン画像 4 点を public/images/ にコピー。画像実在と URL 妥当性を
検証するテストを追加。
EOF
```

---

## Task 2: WorksCard コンポーネント

**Files:**

- Create: `src/components/works/WorksCard.tsx`
- Test: `tests/components/works/WorksCard.test.tsx`

**Interfaces:**

- Consumes: `Work` from `@/lib/works/data.ts`; `Icon` from `@/components/common/Icon.tsx`; tokens from `@/styles/tokens.stylex.ts`
- Produces: `export function WorksCard(props: Work): JSX.Element`

- [ ] **Step 1: テストを書く (失敗する)**

`tests/components/works/WorksCard.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WorksCard } from "@/components/works/WorksCard.tsx";
import type { Work } from "@/lib/works/data.ts";

const withImage: Work = {
  title: "airbeat",
  description: "Offline first metronome application.",
  image: "/images/icon-airbeat.svg",
  urls: [
    { type: "website", url: "https://airbeat.hizapp.blue/" },
    { type: "github", url: "https://github.com/hiz8/airbeat" },
  ],
};

const noImage: Work = {
  title: "NAUTILUS OFFICIAL WEBSITE",
  description: "NAUTILUS の公式ウェブサイト",
  urls: [{ type: "website", url: "https://nautilus-jp.com/" }],
};

describe("WorksCard", () => {
  it("title と description を表示する", () => {
    render(<WorksCard {...withImage} />);
    expect(screen.getByText("airbeat")).toBeInTheDocument();
    expect(screen.getByText("Offline first metronome application.")).toBeInTheDocument();
  });

  it("画像を title を alt として表示する", () => {
    render(<WorksCard {...withImage} />);
    const img = screen.getByRole("img", { name: "airbeat" });
    expect(img).toHaveAttribute("src", "/images/icon-airbeat.svg");
  });

  it("website / github をラベル付きの外部リンクとして表示する", () => {
    render(<WorksCard {...withImage} />);
    const website = screen.getByRole("link", { name: "Website" });
    const github = screen.getByRole("link", { name: "GitHub" });
    expect(website).toHaveAttribute("href", "https://airbeat.hizapp.blue/");
    expect(website).toHaveAttribute("target", "_blank");
    expect(website).toHaveAttribute("rel", "noreferrer");
    expect(github).toHaveAttribute("href", "https://github.com/hiz8/airbeat");
  });

  it("image が無いエントリは <img> を描画しない", () => {
    render(<WorksCard {...noImage} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm run test -- tests/components/works/WorksCard.test.tsx`
Expected: FAIL (`Failed to resolve import "@/components/works/WorksCard.tsx"`)

- [ ] **Step 3: コンポーネントを実装する**

`src/components/works/WorksCard.tsx`:

```tsx
import * as stylex from "@stylexjs/stylex";
import type { IconType } from "@/components/common/Icon.tsx";
import { Icon } from "@/components/common/Icon.tsx";
import type { Work } from "@/lib/works/data.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

const IMAGE_SIZE = 44;

// url.type から表示アイコンとアクセシブルネームを引くマップ。
const URL_META = {
  website: { icon: "global", label: "Website" },
  github: { icon: "github", label: "GitHub" },
} satisfies Record<Work["urls"][number]["type"], { icon: IconType; label: string }>;

const styles = stylex.create({
  root: {
    display: "flex",
    gap: space.s3,
    paddingBlockEnd: space.s4,
    borderBlockEndWidth: 1,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: colors.borderSubtle,
    ":last-child": {
      borderBlockEndWidth: 0,
      paddingBlockEnd: 0,
    },
  },
  imageWrapper: {
    flexShrink: 0,
    width: `${IMAGE_SIZE}px`,
    height: `${IMAGE_SIZE}px`,
    borderRadius: radius.md,
    overflow: "hidden",
    boxSizing: "border-box",
  },
  imageWrapperEmpty: {
    backgroundColor: colors.bgElevated,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
  },
  title: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
  },
  description: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
  },
  urls: {
    display: "flex",
    gap: space.s3,
    marginBlockStart: space.s1,
  },
  urlLink: {
    display: "inline-flex",
    lineHeight: 0,
    color: { default: colors.textSecondary, ":hover": colors.link },
  },
});

export function WorksCard({ title, description, image, urls }: Work) {
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.imageWrapper, image === undefined && styles.imageWrapperEmpty)}>
        {image !== undefined && (
          <img
            src={image}
            alt={title}
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            {...stylex.props(styles.image)}
          />
        )}
      </div>
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.title)}>{title}</div>
        <div {...stylex.props(styles.description)}>{description}</div>
        {urls.length > 0 && (
          <div {...stylex.props(styles.urls)}>
            {urls.map(({ type, url }) => {
              const meta = URL_META[type];
              return (
                <a
                  key={`${type}-${url}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={meta.label}
                  {...stylex.props(styles.urlLink)}
                >
                  <Icon type={meta.icon} size={18} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npm run test -- tests/components/works/WorksCard.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: コミット**

```bash
git add src/components/works/WorksCard.tsx tests/components/works/WorksCard.test.tsx
git commit -F - <<'EOF'
feat(works): プロジェクトカード WorksCard を追加

画像 (44px・角丸・未設定時プレースホルダ) + タイトル + 説明 + website/
github の外部アイコンリンクを描画。リンクには aria-label を付与し、
hiz.blue に無かったアクセシブルネームを補う。
EOF
```

---

## Task 3: /works ルート

**Files:**

- Create: `src/routes/works/index.tsx`

**Interfaces:**

- Consumes: `AppShell` from `@/components/layout/AppShell.tsx`; `Icon`; `WorksCard`; `WORKS` / `ARCHIVED` from `@/lib/works/data.ts`; `makeTitle` from `@/lib/seo/title.ts`
- Produces: route `/works` (`createFileRoute("/works/")`)

- [ ] **Step 1: ルートを実装する**

`src/routes/works/index.tsx`:

```tsx
import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/common/Icon.tsx";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { WorksCard } from "@/components/works/WorksCard.tsx";
import { ARCHIVED, WORKS } from "@/lib/works/data.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const PAGE_DESCRIPTION = "これまで作ってきたプロダクトや公開物。";

const styles = stylex.create({
  wrap: {
    maxWidth: "46em",
  },
  heading: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    letterSpacing: "-0.01em",
    marginBottom: space.s3,
  },
  sub: {
    fontFamily: typography.fontBrand,
    fontStyle: "italic",
    fontSize: typography.fontSizeMd,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
    maxWidth: "32em",
    marginBottom: space.s6,
  },
  section: {
    marginBottom: space.s7,
  },
  sectionHeading: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    marginBottom: space.s4,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
  },
});

export const Route = createFileRoute("/works/")({
  head: () => ({
    meta: [{ title: makeTitle("Works") }, { name: "description", content: PAGE_DESCRIPTION }],
  }),
  component: WorksPage,
});

function WorksPage() {
  return (
    <AppShell variant="list">
      <div {...stylex.props(styles.wrap)}>
        <h1 {...stylex.props(styles.heading)}>
          <Icon type="works" size={30} />
          Works
        </h1>
        <p {...stylex.props(styles.sub)}>{PAGE_DESCRIPTION}</p>

        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionHeading)}>Works</h2>
          <div {...stylex.props(styles.list)}>
            {WORKS.map((work) => (
              <WorksCard key={work.title} {...work} />
            ))}
          </div>
        </section>

        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionHeading)}>Legacy / Archived</h2>
          <div {...stylex.props(styles.list)}>
            {ARCHIVED.map((work) => (
              <WorksCard key={work.title} {...work} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
```

- [ ] **Step 2: ルートツリー再生成 + 型チェック**

Run: `npm run typecheck`
Expected: PASS (エラー 0)。`scripts/generate-routes.ts` が `/works` を含む `src/routeTree.gen.ts` を再生成し、`createFileRoute("/works/")` の型が一致する。

- [ ] **Step 3: 開発サーバーで表示確認 (任意だが推奨)**

Run: `npm run dev` (別ターミナル) → `http://localhost:<port>/works` を開く。
Expected: Works 見出し + 2 セクション + カード + 画像が表示され、website/github リンクが機能する。確認後サーバーを停止する。

- [ ] **Step 4: コミット**

```bash
git add src/routes/works/index.tsx
git commit -F - <<'EOF'
feat(works): /works ルートを追加

AppShell (list, tree なし) 上に brand 見出し + イタリック説明 + Works /
Legacy・Archived の 2 セクションを描画。静的データを直接 import し、
crawlLinks でプリレンダーされる。
EOF
```

---

## Task 4: ナビゲーション導線

**Files:**

- Modify: `src/components/layout/navSections.tsx`
- Modify: `tests/components/IconNav.test.tsx`

**Interfaces:**

- Consumes: 既存の `NavSection` 型 / `sectionActive`
- Produces: `NAV_SECTIONS` 末尾に `to: "/works"` エントリ

- [ ] **Step 1: IconNav テストに routeTree と assertion を追加する (失敗する)**

`tests/components/IconNav.test.tsx` の `renderAtPath` 内 `routeTree` に `/works` を追加する。`make("/books/$isbn")` の直後に 1 行足す:

```tsx
      make("/books/$isbn"),
      make("/works"),
```

さらに `describe("IconNav", ...)` 内の末尾 (最後の `it` の後) に 2 ケース追加する:

```tsx
it("renders Works as an enabled <a> link", async () => {
  renderAtPath("/");
  await waitFor(() => expect(screen.getByText("Works")).toBeInTheDocument());
  expect(document.querySelector('a[href="/works"]')).not.toBeNull();
});

it("treats /works as the active section", async () => {
  renderAtPath("/works");
  await waitFor(() => expect(screen.getByText("Works")).toBeInTheDocument());
  expect(document.querySelector('a[href="/works"]')).not.toBeNull();
});
```

- [ ] **Step 2: テストを実行して失敗を確認する**

Run: `npm run test -- tests/components/IconNav.test.tsx`
Expected: FAIL (`Unable to find an element with the text: Works`)

- [ ] **Step 3: navSections に Works を追加する**

`src/components/layout/navSections.tsx` の `to` union に `"/works"` を追加する:

```tsx
export interface NavSection {
  to: "/" | "/notes" | "/glossary" | "/books" | "/blog" | "/works";
```

`NAV_SECTIONS` 配列の末尾 (Blog エントリの後、閉じ `];` の前) に追加する:

```tsx
  {
    to: "/works",
    label: "Works",
    icon: "works",
    iconActive: "worksBold",
    isActive: sectionActive("/works"),
  },
```

- [ ] **Step 4: テストを実行して成功を確認する**

Run: `npm run test -- tests/components/IconNav.test.tsx`
Expected: PASS (Works の 2 ケースを含む全ケース成功)

- [ ] **Step 5: コミット**

```bash
git add src/components/layout/navSections.tsx tests/components/IconNav.test.tsx
git commit -F - <<'EOF'
feat(works): アイコンナビ末尾に Works 導線を追加

NAV_SECTIONS に /works を追加し、IconNav / MobileBottomNav の双方へ
自動反映。works/worksBold アイコンでアクティブ状態を表現する。
EOF
```

---

## Task 5: 統合検証

**Files:** なし (検証のみ)

- [ ] **Step 1: 全テスト**

Run: `npm run test`
Expected: PASS (works 関連含め全スイート成功)

- [ ] **Step 2: 型チェック**

Run: `npm run typecheck`
Expected: PASS (エラー 0)

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: PASS (エラー 0)

- [ ] **Step 4: フォーマット**

Run: `npm run fmt`
Expected: 変更があれば整形される。差分が出たら `git add -A && git commit` で「chore: フォーマッターによる整形を実行」としてコミットする (末尾に Co-Authored-By トレーラを付ける)。

- [ ] **Step 5: ビルド + プレビューでプリレンダー確認 (推奨)**

Run: `npm run build` (要 `.env` の `VAULT_ROOT`。CI 相当で確認する場合は fixtures 構成を用いる) → `npm run preview` → `/works` を開く。
Expected: `/works` が静的生成され、ナビからの遷移・画像・外部リンクが機能する。

---

## Self-Review

**Spec coverage:**

- ナビ導線追加 (typeWorks / typeWorksBold 使用) → Task 4 (Icon は既存の `works`/`worksBold` を NAV_SECTIONS 経由で使用)。
- `/works` ページ追加 (hiz.blue と同等の内容) → Task 1 (データ) + Task 2 (カード) + Task 3 (ルート)。
- プロジェクトアイコン画像の移植 → Task 1 (4 点コピー + 実在検証)。
- ルート構成 (トップレベル個別) → Task 3 (`src/routes/works/index.tsx`)、component/data は分離。
- ナビ配置 (末尾) → Task 4 (NAV_SECTIONS 末尾)。
- ヘッダ様式 (wip 一覧調) → Task 3 (brand 見出し + イタリック説明 + h2 セクション)。
- テスト方針 (画像実在・URL 妥当 + カード smoke) → Task 1 + Task 2。

**Placeholder scan:** TBD/TODO なし。全ステップに実コードまたは実コマンドを記載。

**Type consistency:** `Work` 型は Task 1 で定義し Task 2/3 が import。`WorksCard(props: Work)`、`WORKS`/`ARCHIVED: Work[]`、`URL_META` の `icon: IconType` は全タスクで一致。`NavSection.to` union は Task 4 で `"/works"` 追加。
