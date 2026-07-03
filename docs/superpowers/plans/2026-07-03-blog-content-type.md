# Blog コンテンツタイプ実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `docs/blog-spec.md` に定義された第 4 のコンテンツタイプ Blog (タグの組み合わせ = ページ) を実装する。

**Architecture:** 既存の汎用収集パイプライン (`collectContentItems`) と Markdown パイプライン (`renderContentDrafts`) に Blog を追加し、新規純関数層 `src/lib/blog/` (タグセット正規形 / ファイル名日時 / ファセット集合ページ列挙 / 共起ツリー) をその上に載せる。ルートは TanStack Start のファイルベースルーティング + crawlLinks プリレンダー (明示的パス列挙なし。全正規ページへの `<Link>` 到達性で担保)。feed / sitemap は `scripts/post-build.ts` を拡張する。

**Tech Stack:** TypeScript (strict) / TanStack Start SSG / react-aria-components / StyleX / remark・rehype / zod v4 / Vitest

## 事前決定事項 (ユーザー未確認、推奨案で進行 — 変更時は該当タスクを修正)

1. **「それ以外のタグ」はクラスタ単位で 1 リンク** (blog-spec L321-333 に従う。L238 の「各リンク先は canonical(P ∪ そのトークン)」は矛盾しているため修正する)
2. **feed エントリ本文は抜粋** (既存 `extractFeedSummary`、HTML strip + 200 grapheme)
3. **`/page/1` への直接到達は 404 のまま** (サイト内リンクは 1 ページ目を常に base URL に向ける。リダイレクトは実装しない)
4. **禁止 frontmatter キー (`title` / `summary` / `featured` / `created`) の混入はビルドエラー**

### 未決事項の確定値 (blog-spec の「未決事項」に対応)

- ファイル名: `YYYY-MM-DD HHmm.md` の厳格一致のみ (秒なし・区切り文字ゆらぎ不可)。実在日時チェックあり
- feed 本文: 抜粋 (上記 2)
- Pagefind: 記事ブロックの本文 div に「現在ページ == その記事の全ファセット正規ページ」のときのみ `data-pagefind-body` を付与。他ページでは属性なし (= インデックス外)。作成日を `<h2 id="p-…">` にして Pagefind の sub-result でアンカー付きリンクを得る
- アンカー id: `p-` + ファイル名 stem の空白を `-` に置換 (`2025-12-11 0930` → `p-2025-12-11-0930`)

## Global Constraints

- TypeScript `strict: true` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes: true` (optional フィールドに `undefined` を明示代入しない。未定義時はキーごと省く)
- import パスは `.ts` / `.tsx` 拡張子付き (`verbatimModuleSyntax` + `allowImportingTsExtensions`)。エイリアス `@/*` → `src/*`
- zod v4: 空オブジェクトで子のデフォルトを発火させるのは `.prefault({})` (`.default({})` は型エラー)
- ビルドエラーは `BuildError` (`src/lib/content/errors.ts`)。`category` / `filePath` / `field` を必ず保持
- `createServerFn` の handler は **inline 必須** (別関数に切り出して渡すと client バンドルに node:fs が残る)。ロジックは `src/server/*.ts` の plain 関数に置き、handler は薄く呼ぶ
- StyleX: `@media` 文字列は**同一ファイル内のフラットな string const** で宣言 (`const BP_DESKTOP = "@media (min-width: 1024px)"`)。他ファイルから import しない。インラインスタイル原則禁止。詳細は `docs/stylex-authoring.md`
- `dangerouslySetInnerHTML` で挿入される HTML のスタイルは `src/styles/content.css` (`@layer components`、`[data-content-body]` スコープ) に書く
- コミットメッセージ・コード内コメント (JSDoc 含む) は日本語。コメントは「なぜ」を語る (CLAUDE.md 準拠)
- タグ・ファセットの並び順は **Unicode コードポイント昇順** (locale 比較・`localeCompare` を使わない)
- URL はトレイリングスラッシュなし。tagset は単一セグメント (`+` = 集合区切り、`--` = 階層区切り)
- 各タスク完了時に `npm run typecheck` / `npm run lint` / `npm run test` を実行し、グリーンを確認してからコミット
- テストは Vitest。`describe` / `it` は日本語のテスト名。fixture Vault は `tests/fixtures/vault/`、config は `tests/helpers/makeConfig.ts`

---

### Task 1: 仕様ドキュメントの整合修正

**Files:**
- Modify: `docs/blog-spec.md`

**Interfaces:**
- Consumes: なし
- Produces: 以降の全タスクが参照する確定仕様

- [ ] **Step 1: L238 のタグリンク単位の矛盾を修正**

`docs/blog-spec.md` の「記事ブロックの構成」項 2 (L238) の末尾:

```
各リンク先は `canonical(現在のファセット集合 ∪ そのトークン)`
```

を以下に置換:

```
併記全体が 1 つのリンク (クラスタ単位)。リンク先は「リンク遷移ルール」を参照
```

- [ ] **Step 2: 「未決事項 (実装時に確定)」セクションを「実装時に確定した事項」に書き換え**

blog-spec 末尾の「## 未決事項 (実装時に確定)」を以下に置換:

```markdown
## 実装時に確定した事項

- ファイル名日時は `YYYY-MM-DD HHmm` の厳格一致のみ (秒なし、区切り文字のゆらぎ不可)。正規表現 + 実在日時チェック
- feed エントリの本文は抜粋 (既存 `extractFeedSummary`、本文 HTML strip + 200 grapheme)
- Pagefind の重複排除: 記事ブロック本文の div に「現在ページ = その記事の全ファセット集合ページ (正規形)」のときのみ `data-pagefind-body` を付与する。作成日見出し `<h2 id="p-…">` を各記事に置き、sub-result でアンカー付きの検索結果リンクを得る
- 記事アンカー id はファイル名 stem の空白を `-` に置換し `p-` を前置 (`2025-12-11 0930` → `p-2025-12-11-0930`)。ファイル名フォーマットが厳格なため追加の正規化は不要
- frontmatter に `title` / `summary` / `featured` / `created` が書かれていた場合はビルドエラー (「持たない」キーの混入を許さない)
- `/page/1` へのリダイレクトは行わない (サイト内リンクは 1 ページ目を常に `/blog` / `/blog/tags/[tagset]` に向けるため、`/page/1` は生成されず 404 となる)
```

- [ ] **Step 3: 「ページネーション」節の `/page/1` 文言を確定内容に合わせる**

「1 ページ目は `/blog` および `/blog/tags/…` (`/page/1` は生成しない。`/page/1` への到達時は 1 ページ目へ正規化)」の括弧内を「(`/page/1` は生成せず、サイト内からリンクもしないため到達時は 404)」に置換。

- [ ] **Step 4: コミット**

```bash
git add docs/blog-spec.md
git commit -m "docs(blog): 実装前のレビューで確定した事項を仕様へ反映"
```

---

### Task 2: タグセット純関数 (`src/lib/blog/tagset.ts`)

**Files:**
- Create: `src/lib/blog/tagset.ts`
- Test: `tests/lib/blog/tagset.test.ts`

**Interfaces:**
- Consumes: `tagAncestors`, `encodeTagToSlug`, `decodeTagSlug` (`@/lib/tags/index.ts`)
- Produces:
  - `compareCodePoints(a: string, b: string): number`
  - `validateBlogTagToken(token: string): string | null` — 違反メッセージ or null
  - `articleFacets(tokens: readonly string[]): string[]` — 全トークンのプレフィックス和 (重複排除、コードポイント昇順)
  - `canonicalizeFacetSet(facets: Iterable<string>): string[]` — 重複排除 + 冗長祖先除去 (antichain 化) + コードポイント昇順
  - `canonicalFullFacetSet(tokens: readonly string[]): string[]` — 記事の「最も特定的な」正規集合
  - `encodeTagset(canonicalFacets: readonly string[]): string` / `decodeTagset(segment: string): string[]`
  - `canonicalTagsetOf(facets: Iterable<string>): string` — `encodeTagset(canonicalizeFacetSet(facets))`
  - `facetSetSatisfies(articleFacets: ReadonlySet<string>, pageFacets: readonly string[]): boolean`
  - `blogArticleTitle(tokens: readonly string[]): string` — `#f1#f2…` (正規順、階層はフルパス)

- [ ] **Step 1: 失敗するテストを書く** (`tests/lib/blog/tagset.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import {
  articleFacets,
  blogArticleTitle,
  canonicalFullFacetSet,
  canonicalizeFacetSet,
  canonicalTagsetOf,
  compareCodePoints,
  decodeTagset,
  encodeTagset,
  facetSetSatisfies,
  validateBlogTagToken,
} from "@/lib/blog/tagset.ts";

describe("compareCodePoints", () => {
  it("Latin → カタカナ → 漢字 の順になる (仕様 L88 の例)", () => {
    const sorted = ["映画", "スターウォーズ", "UI-UX", "マイクロコピー", "デザインシステム", "ライティング"]
      .sort(compareCodePoints);
    expect(sorted).toEqual(["UI-UX", "スターウォーズ", "デザインシステム", "マイクロコピー", "ライティング", "映画"]);
  });

  it("階層ファセットは論理パス文字列で比較する", () => {
    expect(compareCodePoints("UI-UX/デザインシステム", "UI-UX/マイクロコピー")).toBeLessThan(0);
  });
});

describe("validateBlogTagToken", () => {
  it("正常なトークンは null を返す", () => {
    expect(validateBlogTagToken("react")).toBeNull();
    expect(validateBlogTagToken("UI-UX")).toBeNull(); // 単独の - は可
    expect(validateBlogTagToken("UI-UX/デザインシステム")).toBeNull();
  });

  it.each([
    ["", "空"],
    ["A/B/C", "深さ"],
    ["/A", "空セグメント"],
    ["A/", "空セグメント"],
    ["A//B", "空セグメント"],
    ["a+b", "+"],
    ["a--b", "--"],
    ["-a", "-"],
    ["a-", "-"],
    ["page", "予約語"],
    ["A/page", "予約語"],
  ])("%s は拒否される", (token) => {
    expect(validateBlogTagToken(token)).not.toBeNull();
  });
});

describe("facets / 正規形", () => {
  it("articleFacets は全プレフィックスの和を返す", () => {
    expect(articleFacets(["UI-UX/デザインシステム", "映画"]))
      .toEqual(["UI-UX", "UI-UX/デザインシステム", "映画"]);
  });

  it("canonicalizeFacetSet は冗長な祖先を落とす (仕様 L111)", () => {
    expect(canonicalizeFacetSet(["UI-UX", "UI-UX/デザインシステム"]))
      .toEqual(["UI-UX/デザインシステム"]);
  });

  it("canonicalizeFacetSet はコードポイント昇順に並べる", () => {
    expect(canonicalizeFacetSet(["映画", "スターウォーズ"]))
      .toEqual(["スターウォーズ", "映画"]);
  });

  it("canonicalFullFacetSet はトークンから最特定の antichain を作る", () => {
    // #A と #A/B を両方持つ記事 → A は冗長
    expect(canonicalFullFacetSet(["UI-UX", "UI-UX/デザインシステム"]))
      .toEqual(["UI-UX/デザインシステム"]);
  });

  it("encodeTagset / decodeTagset は仕様の例と一致する (L104-108)", () => {
    expect(encodeTagset(["UI-UX"])).toBe("UI-UX");
    expect(encodeTagset(["UI-UX/デザインシステム"])).toBe("UI-UX--デザインシステム");
    expect(encodeTagset(["スターウォーズ", "映画"])).toBe("スターウォーズ+映画");
    expect(encodeTagset(["UI-UX/デザインシステム", "映画"])).toBe("UI-UX--デザインシステム+映画");
    expect(decodeTagset("UI-UX--デザインシステム+映画")).toEqual(["UI-UX/デザインシステム", "映画"]);
  });

  it("canonicalTagsetOf は非正規入力 (順序違い・冗長祖先) を正規形へ収束させる", () => {
    expect(canonicalTagsetOf(["映画", "スターウォーズ"])).toBe("スターウォーズ+映画");
    expect(canonicalTagsetOf(["UI-UX", "UI-UX/デザインシステム", "映画"])).toBe("UI-UX--デザインシステム+映画");
  });

  it("facetSetSatisfies は部分集合判定 (⊇) を行う", () => {
    const article = new Set(["UI-UX", "UI-UX/デザインシステム", "映画"]);
    expect(facetSetSatisfies(article, ["UI-UX"])).toBe(true);
    expect(facetSetSatisfies(article, ["UI-UX/デザインシステム", "映画"])).toBe(true);
    expect(facetSetSatisfies(article, ["スターウォーズ"])).toBe(false);
  });

  it("blogArticleTitle は正規順の # 併記 (階層はフルパス)", () => {
    expect(blogArticleTitle(["ライティング", "UI-UX", "マイクロコピー"]))
      .toBe("#UI-UX#マイクロコピー#ライティング");
    expect(blogArticleTitle(["UI-UX/デザインシステム"])).toBe("#UI-UX/デザインシステム");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/blog/tagset.test.ts`
Expected: FAIL (モジュールが存在しない)

- [ ] **Step 3: 実装** (`src/lib/blog/tagset.ts`)

```typescript
import { decodeTagSlug, encodeTagToSlug, tagAncestors } from "@/lib/tags/index.ts";

// Blog のタグ・ファセット集合モデル。
// 並び順はすべて Unicode コードポイント昇順 (localeCompare は使わない)。この順序が
// ファセット集合の正規形 (URL に用いる唯一の並び) を一意に決める (docs/blog-spec.md)。

const SET_SEPARATOR = "+";
const RESERVED_SEGMENT = "page";

export function compareCodePoints(a: string, b: string): number {
  const as = [...a];
  const bs = [...b];
  const len = Math.min(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const ca = as[i]!.codePointAt(0)!;
    const cb = bs[i]!.codePointAt(0)!;
    if (ca !== cb) return ca - cb;
  }
  return as.length - bs.length;
}

// トークン 1 個のバリデーション。違反があれば理由 (日本語メッセージ) を、なければ null を返す。
// URL 文法 (`+` = 集合区切り、`--` = 階層区切り、`page` = ページネーション) との衝突を弾く。
export function validateBlogTagToken(token: string): string | null {
  if (token === "") return "タグが空です";
  const segments = token.split("/");
  if (segments.length > 2) return `階層タグの深さは 2 までです (${token})`;
  for (const seg of segments) {
    if (seg === "") return `空のタグセグメントがあります (${token})`;
    if (seg.includes(SET_SEPARATOR)) return `タグセグメントに "+" は使えません (${token})`;
    if (seg.includes("--")) return `タグセグメントに "--" は使えません (${token})`;
    if (seg.startsWith("-") || seg.endsWith("-")) {
      return `タグセグメントを "-" で始める・終わることはできません (${token})`;
    }
    if (seg === RESERVED_SEGMENT) return `"page" は予約語のためタグセグメントに使えません (${token})`;
  }
  return null;
}

export function articleFacets(tokens: readonly string[]): string[] {
  const set = new Set<string>();
  for (const token of tokens) {
    for (const facet of tagAncestors(token)) set.add(facet);
  }
  return [...set].sort(compareCodePoints);
}

export function canonicalizeFacetSet(facets: Iterable<string>): string[] {
  const unique = [...new Set(facets)];
  // f が他の g の真プレフィックスなら f は冗長 (g が f を含意する)
  const kept = unique.filter((f) => !unique.some((g) => g.startsWith(`${f}/`)));
  return kept.sort(compareCodePoints);
}

export function canonicalFullFacetSet(tokens: readonly string[]): string[] {
  return canonicalizeFacetSet(articleFacets(tokens));
}

export function encodeTagset(canonicalFacets: readonly string[]): string {
  return canonicalFacets.map(encodeTagToSlug).join(SET_SEPARATOR);
}

export function decodeTagset(segment: string): string[] {
  return segment.split(SET_SEPARATOR).map(decodeTagSlug);
}

export function canonicalTagsetOf(facets: Iterable<string>): string {
  return encodeTagset(canonicalizeFacetSet(facets));
}

export function facetSetSatisfies(
  articleFacets: ReadonlySet<string>,
  pageFacets: readonly string[],
): boolean {
  return pageFacets.every((f) => articleFacets.has(f));
}

// 記事の実質タイトル: 全ファセット集合の正規形を # 併記 (階層はフルパス)。
// feed エントリ・トップ「最近更新」・pickContentTitle のフォールバックで共用する。
export function blogArticleTitle(tokens: readonly string[]): string {
  return canonicalFullFacetSet(tokens).map((f) => `#${f}`).join("");
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/blog/tagset.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/blog/tagset.ts tests/lib/blog/tagset.test.ts
git commit -m "feat(blog): タグセット正規形の純関数群を追加"
```

---

### Task 3: ファイル名日時の純関数 (`src/lib/blog/filename.ts`)

**Files:**
- Create: `src/lib/blog/filename.ts`
- Test: `tests/lib/blog/filename.test.ts`

**Interfaces:**
- Consumes: なし
- Produces:
  - `interface BlogArticleDate { slug: string; createdIso: string; displayDate: string; anchorId: string }`
  - `parseBlogSlugDate(slug: string, timezone: string): BlogArticleDate | null` — slug はファイル名 stem (`"2025-12-11 0930"`)。不正フォーマット・非実在日時は null
  - 並び順は slug の文字列降順 = 作成日時降順 (固定幅フォーマットのため)。専用のソート関数は設けない

- [ ] **Step 1: 失敗するテストを書く** (`tests/lib/blog/filename.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";

describe("parseBlogSlugDate", () => {
  it("正常なファイル名 stem をパースする", () => {
    expect(parseBlogSlugDate("2025-12-11 0930", "+09:00")).toEqual({
      slug: "2025-12-11 0930",
      createdIso: "2025-12-11T09:30:00+09:00",
      displayDate: "2025/12/11",
      anchorId: "p-2025-12-11-0930",
    });
  });

  it.each([
    "2025-12-11",          // 時刻なし
    "2025-12-11 09:30",    // コロン入り
    "2025-12-11T0930",     // 区切りが T
    "2025-12-11 093000",   // 秒付き
    "2025-13-01 0930",     // 13 月
    "2025-02-30 0930",     // 非実在日
    "2025-12-11 2460",     // 時刻範囲外
    "メモ",                 // 日付でない
  ])("%s は null を返す", (slug) => {
    expect(parseBlogSlugDate(slug, "+09:00")).toBeNull();
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/blog/filename.test.ts`
Expected: FAIL (モジュールが存在しない)

- [ ] **Step 3: 実装** (`src/lib/blog/filename.ts`)

```typescript
// Blog 記事の作成日時はファイル名を唯一の正とする (docs/blog-spec.md)。
// Obsidian / OS のファイル名制約のため ":" は使えず、時刻は HHmm の 4 桁連結。
// フォーマットが固定幅のため、slug の文字列順 = 作成日時順が成り立つ。

export interface BlogArticleDate {
  slug: string;
  /** ISO 8601 (タイムゾーンは site.config.ts の content.blog.timezone) */
  createdIso: string;
  /** 記事ブロックに表示する YYYY/MM/DD */
  displayDate: string;
  /** 全ページで共通の記事アンカー id (空白を "-" に置換して "p-" を前置) */
  anchorId: string;
}

const SLUG_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) ([01]\d|2[0-3])([0-5]\d)$/;

export function parseBlogSlugDate(slug: string, timezone: string): BlogArticleDate | null {
  const m = SLUG_PATTERN.exec(slug);
  if (!m) return null;
  const [, year, month, day, hour, minute] = m;
  const iso = `${year}-${month}-${day}T${hour}:${minute}:00${timezone}`;
  // 2025-02-30 のような非実在日は Date の ISO パースが Invalid Date を返す
  if (Number.isNaN(new Date(iso).getTime())) return null;
  return {
    slug,
    createdIso: iso,
    displayDate: `${year}/${month}/${day}`,
    anchorId: `p-${year}-${month}-${day}-${hour}${minute}`,
  };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/blog/filename.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/blog/filename.ts tests/lib/blog/filename.test.ts
git commit -m "feat(blog): ファイル名日時パースの純関数を追加"
```

---

### Task 4: コンテンツ層 — 型・config・validator・collectBlog・fixtures

`ContentType` union に `"blog"` を足すと `satisfies Record<ContentType, …>` を使う複数ファイルが型エラーになる。このタスクで全部まとめて解消し、`npm run typecheck` グリーンで完結させる。

**Files:**
- Modify: `src/types/content.ts` (L1 の `ContentType`、`BlogFrontmatter` 追加)
- Modify: `src/types/config.ts` (`BlogContentConfig`、`ContentConfig`、`SiteConfigInput`)
- Modify: `src/lib/config/schema.ts` (`blogContentSchema` + `contentSchema.blog`)
- Modify: `site.config.ts` (`content.blog` 追加、notes.exclude に `"Blog/**"`)
- Modify: `src/lib/content/validate.ts` (`validateBlogFrontmatter`)
- Modify: `src/lib/content/index.ts` (`collectBlog`)
- Modify: `src/lib/content/title.ts` (`TITLE_FIELD` / `pickContentTitle` の blog 対応)
- Modify: `src/components/common/contentTypeLabels.ts` (`blog: "Blog"`)
- Modify: `src/components/common/ContentTypeIcon.tsx` (switch に blog ケース。`Icon` の `type="blog"` は定義済み)
- Modify: `src/components/layout/TreeSidebar.tsx` (`COPY: Record<ContentType, …>` に blog エントリ。Blog は専用サイドバー (Task 10) を使うためプレースホルダ文言でよい)
- Modify: `tests/helpers/makeConfig.ts` (blog 設定 + exclude)
- Create: `tests/fixtures/vault/Blog/*.md` (6 ファイル)
- Create: `tests/fixtures/vault-blog-invalid/Blog/2025-13-99 0930.md`
- Test: `tests/lib/content/blog.test.ts`

**Interfaces:**
- Consumes: `collectContentItems` (`src/lib/content/collect.ts:47`)、`validateBlogTagToken` (Task 2)、`parseBlogSlugDate` (Task 3)
- Produces:
  - `type ContentType = "notes" | "glossary" | "books" | "blog"`
  - `interface BlogFrontmatter { tags: string[]; updated: string; status: Status }` (standalone。`BaseFrontmatter` の全フィールドが optional なので構造的に代入可能)
  - `validateBlogFrontmatter(raw: Record<string, unknown>, filePath: string): BlogFrontmatter`
  - `collectBlog(config: SiteConfigParsed): Promise<ContentItem<BlogFrontmatter>[]>` — ファイル名バリデーション込み、本文空は console.warn
  - config: `content.blog: { path: string; feedMaxItems: number; timezone: string }`

- [ ] **Step 1: 失敗するテストを書く** (`tests/lib/content/blog.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import { collectBlog, validateBlogFrontmatter } from "@/lib/content/index.ts";
import { BuildError } from "@/lib/content/errors.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("validateBlogFrontmatter", () => {
  const valid = {
    tags: ["UI-UX", "マイクロコピー"],
    updated: "2025-12-20T10:00:00+09:00",
    status: "published",
  };
  const path = "Blog/2025-12-11 0930.md";

  it("正常な frontmatter を通す", () => {
    const fm = validateBlogFrontmatter(valid, path);
    expect(fm.tags).toEqual(["UI-UX", "マイクロコピー"]);
    expect(fm.status).toBe("published");
  });

  it.each([
    [{ ...valid, tags: [] }, "tags 空"],
    [{ ...valid, tags: ["a", "b", "c", "d", "e"] }, "5 トークン"],
    [{ ...valid, tags: ["A/B/C"] }, "深さ 3"],
    [{ ...valid, tags: ["a+b"] }, "+ 入り"],
    [{ ...valid, tags: ["a--b"] }, "-- 入り"],
    [{ ...valid, tags: ["page"] }, "予約語"],
    [{ tags: valid.tags, status: "published" }, "updated 欠損"],
    [{ tags: valid.tags, updated: valid.updated }, "status 欠損 (Blog は明示必須)"],
    [{ ...valid, status: "public" }, "enum 違反"],
    [{ ...valid, title: "x" }, "禁止キー title"],
    [{ ...valid, summary: "x" }, "禁止キー summary"],
    [{ ...valid, featured: true }, "禁止キー featured"],
    [{ ...valid, created: "2025-01-01" }, "禁止キー created"],
  ])("%# %s はビルドエラー", (raw) => {
    expect(() => validateBlogFrontmatter(raw as Record<string, unknown>, path)).toThrowError(BuildError);
  });

  it("ファイル名が YYYY-MM-DD HHmm 形式でないとビルドエラー", () => {
    expect(() => validateBlogFrontmatter(valid, "Blog/メモ.md")).toThrowError(BuildError);
    expect(() => validateBlogFrontmatter(valid, "Blog/2025-13-99 0930.md")).toThrowError(BuildError);
  });
});

describe("collectBlog", () => {
  it("公開記事のみを収集し draft を除外する", async () => {
    const items = await collectBlog(makeConfig("vault"));
    const slugs = items.map((i) => i.slug);
    expect(slugs).toContain("2025-12-11 0930");
    expect(slugs).not.toContain("2024-12-01 0000"); // draft
    expect(items.every((i) => i.type === "blog")).toBe(true);
  });

  it("不正なファイル名の Vault は BuildError で失敗する", async () => {
    await expect(collectBlog(makeConfig("vault-blog-invalid"))).rejects.toBeInstanceOf(BuildError);
  });
});
```

- [ ] **Step 2: fixtures を作成**

`tests/fixtures/vault/Blog/` に 6 ファイル (仕様イメージ A / A2 / B を再現できるタグ構成):

`tests/fixtures/vault/Blog/2025-12-11 0930.md`
```markdown
---
tags:
  - UI-UX
  - マイクロコピー
  - ライティング
updated: 2025-12-20T10:00:00+09:00
status: published
---
マイクロコピーの書き方について。[[note-a]] も参照。
```

`tests/fixtures/vault/Blog/2025-10-29 1400.md`
```markdown
---
tags:
  - UI-UX/デザインシステム
updated: 2025-11-01T09:00:00+09:00
status: published
---
デザインシステムの階層タグ記事。
```

`tests/fixtures/vault/Blog/2025-07-24 0800.md`
```markdown
---
tags:
  - UI-UX
updated: 2025-07-24T08:00:00+09:00
status: published
---
UI-UX 単独タグの記事。
```

`tests/fixtures/vault/Blog/2025-04-09 2145.md`
```markdown
---
tags:
  - UI-UX
  - マイクロコピー
  - ライティング
updated: 2025-04-10T00:00:00+09:00
status: published
---
2 本目のマイクロコピー記事。
```

`tests/fixtures/vault/Blog/2025-02-14 0930.md`
```markdown
---
tags:
  - 映画
  - スターウォーズ
updated: 2025-02-14T09:30:00+09:00
status: published
---
脚注付きの記事[^1]。

> [!note] メモ
> Marginalia になる Callout。

[^1]: 脚注本文。
```

`tests/fixtures/vault/Blog/2024-12-01 0000.md`
```markdown
---
tags:
  - UI-UX
updated: 2024-12-01T00:00:00+09:00
status: draft
---
draft は除外される。
```

`tests/fixtures/vault-blog-invalid/Blog/2025-13-99 0930.md`
```markdown
---
tags:
  - UI-UX
updated: 2025-01-01T00:00:00+09:00
status: published
---
13 月 99 日は実在しない。
```

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx vitest run tests/lib/content/blog.test.ts`
Expected: FAIL (`collectBlog` / `validateBlogFrontmatter` が存在しない)

- [ ] **Step 4: 型を拡張** (`src/types/content.ts`)

```typescript
export type ContentType = "notes" | "glossary" | "books" | "blog";
```

`BooksFrontmatter` の後に追加:

```typescript
// Blog は全メタデータ必須 + title / summary / featured / created を「持たない」
// (作成日時はファイル名が唯一の正)。BaseFrontmatter は全フィールド optional
// なので、この standalone 定義でも構造的に BaseFrontmatter へ代入可能。
export interface BlogFrontmatter {
  tags: string[];
  updated: string;
  status: Status;
}
```

`RenderedBook` エイリアスの並びに `export type RenderedBlogArticle = RenderedItem<BlogFrontmatter>;` を追加。

- [ ] **Step 5: config スキーマと型を拡張**

`src/lib/config/schema.ts` — `booksContentSchema` の後に:

```typescript
const blogContentSchema = z.object({
  path: z.string().default("Blog"),
  feedMaxItems: z.number().int().positive().default(20),
  timezone: z.string().default("+09:00"),
});
```

`contentSchema` に `blog: blogContentSchema.prefault({}),` を追加。

`src/types/config.ts` — `BooksContentConfig` の並びに:

```typescript
export interface BlogContentConfig {
  path: string;
  /** /blog/feed.xml の最大件数 */
  feedMaxItems: number;
  /** ファイル名日時の解釈タイムゾーン (例 "+09:00") */
  timezone: string;
}
```

`ContentConfig` に `blog: BlogContentConfig;` を、`SiteConfigInput` 側の content にも対応する Partial エントリを追加 (既存の notes / glossary / books の書き方に合わせる)。

`site.config.ts` — `content.notes.exclude` 配列に `"Blog/**"` を追加し、`books: { path: "Books" },` の後に:

```typescript
blog: {
  path: "Blog",
  feedMaxItems: 20,   // /blog/feed.xml の最大件数
  timezone: "+09:00", // ファイル名日時の解釈タイムゾーン
},
```

`tests/helpers/makeConfig.ts` — content に `blog: { path: "Blog", feedMaxItems: 20, timezone: "+09:00" }` を追加し、notes.exclude に `"Blog/**"` を追加。

- [ ] **Step 6: validator を実装** (`src/lib/content/validate.ts`)

`booksFrontmatterSchema` の後に追加。既存の `stripNulls` / `statusSchema` / `isoDateString` / `frontmatterError` を再利用する:

```typescript
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";
import { validateBlogTagToken } from "@/lib/blog/tagset.ts";
import { deriveSlug } from "./slug.ts";

// Blog で「持たない」と定義したキー。混入は二重管理 (特に created) の温床になるため
// 黙って無視せずビルドエラーにする (docs/blog-spec.md「実装時に確定した事項」)。
const BLOG_FORBIDDEN_KEYS = ["title", "summary", "featured", "created"] as const;

const blogFrontmatterSchema = z.object({
  tags: z.array(z.string()).min(1, "tags は 1 個以上必要です").max(4, "タグは 1 記事あたり最大 4 トークンです"),
  updated: isoDateString,
  status: statusSchema,
});

export function validateBlogFrontmatter(
  raw: Record<string, unknown>,
  filePath: string,
): BlogFrontmatter {
  // stripNulls 前に検査する: `created:` (値なし = null) のような書き方も混入として扱う
  for (const key of BLOG_FORBIDDEN_KEYS) {
    if (key in raw) {
      throw new BuildError({
        category: "invalid-frontmatter",
        filePath,
        field: key,
        message: `Blog は ${key} を持ちません (${key === "created" ? "作成日時はファイル名が唯一の正です" : "docs/blog-spec.md 参照"})`,
      });
    }
  }

  const slug = deriveSlug(filePath);
  if (parseBlogSlugDate(slug, "+00:00") === null) {
    throw new BuildError({
      category: "invalid-frontmatter",
      filePath,
      message: `Blog のファイル名は "YYYY-MM-DD HHmm.md" 形式の実在日時である必要があります (例: "2025-12-11 0930.md")`,
    });
  }

  const parsed = blogFrontmatterSchema.safeParse(stripNulls(raw));
  if (!parsed.success) throw frontmatterError(parsed.error, filePath);

  for (const token of parsed.data.tags) {
    const issue = validateBlogTagToken(token);
    if (issue !== null) {
      throw new BuildError({
        category: "invalid-frontmatter",
        filePath,
        field: "tags",
        message: issue,
      });
    }
  }

  return parsed.data;
}
```

注意: ここでの `parseBlogSlugDate` はフォーマット検証のみが目的なのでタイムゾーンはダミー (`"+00:00"`) でよい。表示用の変換は Task 8 の projection が config の `content.blog.timezone` で行う。

- [ ] **Step 7: collectBlog を実装** (`src/lib/content/index.ts`)

`collectBooks` の後に追加:

```typescript
export async function collectBlog(config: SiteConfigParsed): Promise<ContentItem<BlogFrontmatter>[]> {
  const items = await collectContentItems<BlogFrontmatter>({
    type: "blog",
    vaultRoot: config.content.vaultRoot,
    path: config.content.blog.path,
    validate: validateBlogFrontmatter,
  });
  for (const item of items) {
    // 仕様上、本文空はエラーではなく警告で継続する
    if (item.body.trim() === "") {
      console.warn(`[blog] ${item.filePath}: 本文が空です`);
    }
  }
  return items;
}
```

`validateBlogFrontmatter` と `BlogFrontmatter` の re-export も既存の並びに追加する。

- [ ] **Step 8: ContentType 波及の型エラーを解消**

`npm run typecheck` を実行し、`Record<ContentType, …>` / switch の網羅性エラーが出る箇所を修正:

- `src/lib/content/title.ts` — `TITLE_FIELD` に blog エントリ。blog に「タイトルフィールド」はないため、`pickContentTitle` を blog のとき `blogArticleTitle(item.frontmatter.tags ?? [])` を返すよう分岐する (`import { blogArticleTitle } from "@/lib/blog/tagset.ts"`)。blog はリンク解決インデックスに登録されないため embed の Source ラベルで実際に呼ばれることはないが、網羅性は保つ
- `src/components/common/contentTypeLabels.ts` — `blog: "Blog"`
- `src/components/common/ContentTypeIcon.tsx` — switch に `case "blog":` を追加し `<Icon type="blog" …>` (既存ケースの実装パターンに合わせる)
- `src/components/layout/TreeSidebar.tsx` — `COPY` に blog エントリ (`{ ariaLabel: "Blog tags", placeholder: "Filter tags", empty: "No tags" }` 相当。Blog は Task 10 で専用サイドバーを使うため、この文言が表示されることはない)
- その他 typecheck が指摘した箇所すべて

- [ ] **Step 9: テスト + 全体検証**

Run: `npx vitest run tests/lib/content/blog.test.ts`
Expected: PASS

Run: `npm run typecheck && npm run lint && npm run test`
Expected: すべてグリーン (既存テストが Blog fixtures の追加で壊れていないこと。壊れた場合は notes の exclude 漏れを疑う)

- [ ] **Step 10: コミット**

```bash
git add -A
git commit -m "feat(blog): コンテンツ収集層と frontmatter バリデーションを追加"
```

---

### Task 5: ファセット集合ページモデル (`src/lib/blog/pages.ts`)

**Files:**
- Create: `src/lib/blog/pages.ts`
- Test: `tests/lib/blog/pages.test.ts`

**Interfaces:**
- Consumes: Task 2 の tagset 関数群
- Produces:
  - `interface BlogFacetInput { slug: string; tags: readonly string[] }`
  - `interface FacetPage { tagset: string; facets: string[]; slugs: string[] }` — slugs は作成日時降順
  - `enumerateFacetPages(articles: readonly BlogFacetInput[]): Map<string, FacetPage>` — 「S を含む公開記事が 1 件以上ある antichain S」を全列挙。キーは正規形 tagset
  - `BLOG_PAGE_SIZE = 10` / `pageCount(total: number): number` / `pageSlice<T>(items: readonly T[], page: number): T[]`
  - `interface BlogLinkTarget { tagset: string; page: number }` (page 1 = base URL)
  - `locateArticle(pages: ReadonlyMap<string, FacetPage>, tagset: string, slug: string): BlogLinkTarget | null` — 遷移先ページ番号をビルド時に算出 (仕様 L334)
  - `interface RemainingToken { token: string; label: string }`
  - `remainingTokens(tokens: readonly string[], pageFacets: readonly string[]): RemainingToken[]` — 「それ以外のタグ」。label は現在ページの親ファセット分を省いた表示 (仕様 L238)、論理パス順

- [ ] **Step 1: 失敗するテストを書く** (`tests/lib/blog/pages.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import {
  BLOG_PAGE_SIZE,
  enumerateFacetPages,
  locateArticle,
  pageCount,
  pageSlice,
  remainingTokens,
} from "@/lib/blog/pages.ts";

// 仕様イメージ A / B に対応する記事セット (slug 降順 = 作成日時降順)
const articles = [
  { slug: "2025-12-11 0930", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-10-29 1400", tags: ["UI-UX/デザインシステム"] },
  { slug: "2025-07-24 0800", tags: ["UI-UX"] },
  { slug: "2025-04-09 2145", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-02-14 0930", tags: ["映画", "スターウォーズ"] },
];

describe("enumerateFacetPages", () => {
  const pages = enumerateFacetPages(articles);

  it("親ファセットのページは階層タグの記事も拾う (仕様 L122)", () => {
    expect(pages.get("UI-UX")?.slugs).toEqual([
      "2025-12-11 0930",
      "2025-10-29 1400",
      "2025-07-24 0800",
      "2025-04-09 2145",
    ]);
  });

  it("葉セグメント単独のページは生成しない (仕様 L78)", () => {
    expect(pages.has("デザインシステム")).toBe(false);
  });

  it("階層ファセットのページを生成する", () => {
    expect(pages.get("UI-UX--デザインシステム")?.slugs).toEqual(["2025-10-29 1400"]);
  });

  it("共起の集合ページを正規形キーで生成する (順列の重複キーはない)", () => {
    expect(pages.get("スターウォーズ+映画")?.slugs).toEqual(["2025-02-14 0930"]);
    expect(pages.has("映画+スターウォーズ")).toBe(false);
    expect(pages.get("UI-UX+マイクロコピー+ライティング")?.slugs).toEqual([
      "2025-12-11 0930",
      "2025-04-09 2145",
    ]);
  });

  it("ある集合のページが存在するなら、その任意の部分集合ページも存在する (仕様 L143)", () => {
    expect(pages.has("マイクロコピー+ライティング")).toBe(true);
    expect(pages.has("マイクロコピー")).toBe(true);
    expect(pages.has("ライティング")).toBe(true);
  });
});

describe("pagination", () => {
  it("10 件ごとに区切る", () => {
    expect(BLOG_PAGE_SIZE).toBe(10);
    const items = Array.from({ length: 23 }, (_, i) => i);
    expect(pageCount(23)).toBe(3);
    expect(pageSlice(items, 1)).toHaveLength(10);
    expect(pageSlice(items, 3)).toHaveLength(3);
    expect(pageSlice(items, 4)).toHaveLength(0);
  });
});

describe("locateArticle", () => {
  it("対象記事の掲載ページ番号を返す", () => {
    const pages = enumerateFacetPages(articles);
    expect(locateArticle(pages, "UI-UX", "2025-04-09 2145")).toEqual({ tagset: "UI-UX", page: 1 });
  });

  it("11 件目以降は page 2 になる", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      slug: `2025-01-${String(i + 1).padStart(2, "0")} 0900`,
      tags: ["映画"],
    }));
    const pages = enumerateFacetPages(many);
    expect(locateArticle(pages, "映画", "2025-01-01 0900")).toEqual({ tagset: "映画", page: 2 });
  });

  it("存在しない組み合わせは null", () => {
    const pages = enumerateFacetPages(articles);
    expect(locateArticle(pages, "映画", "2025-12-11 0930")).toBeNull();
  });
});

describe("remainingTokens", () => {
  it("トップページ (P = 空) では全トークンをフルパスで論理パス順に返す", () => {
    expect(remainingTokens(["ライティング", "UI-UX", "マイクロコピー"], [])).toEqual([
      { token: "UI-UX", label: "UI-UX" },
      { token: "マイクロコピー", label: "マイクロコピー" },
      { token: "ライティング", label: "ライティング" },
    ]);
  });

  it("ページで指定済みのトークンを除く (仕様イメージ B)", () => {
    expect(remainingTokens(["UI-UX", "マイクロコピー", "ライティング"], ["UI-UX"])).toEqual([
      { token: "マイクロコピー", label: "マイクロコピー" },
      { token: "ライティング", label: "ライティング" },
    ]);
    expect(remainingTokens(["UI-UX"], ["UI-UX"])).toEqual([]);
  });

  it("階層タグは親ファセットが指定済みなら残りセグメントのみ表示 (仕様 L238)", () => {
    expect(remainingTokens(["UI-UX/デザインシステム"], ["UI-UX"])).toEqual([
      { token: "UI-UX/デザインシステム", label: "デザインシステム" },
    ]);
    // 完全一致で指定済みなら除外
    expect(remainingTokens(["UI-UX/デザインシステム"], ["UI-UX/デザインシステム"])).toEqual([]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/blog/pages.test.ts`
Expected: FAIL (モジュールが存在しない)

- [ ] **Step 3: 実装** (`src/lib/blog/pages.ts`)

```typescript
import { tagAncestors } from "@/lib/tags/index.ts";
import {
  articleFacets,
  canonicalizeFacetSet,
  compareCodePoints,
  encodeTagset,
} from "./tagset.ts";

// ファセット集合ページの列挙と、ビルド時のリンク先算出 (docs/blog-spec.md「URL 構造」)。
// 生成対象 = 「S を部分集合として含む公開記事が 1 件以上存在する antichain S」。
// 列挙は記事ごとに「各トークンを (含めない / 根まで / フルパス) のいずれかで採用」した
// 組み合わせを canonical 化する方式を取る。トークン最大 4 なので高々 3^4 - 1 通り/記事。

export interface BlogFacetInput {
  slug: string;
  tags: readonly string[];
}

export interface FacetPage {
  tagset: string;
  facets: string[];
  /** 作成日時降順 (slug は固定幅の日時フォーマットのため文字列降順でよい) */
  slugs: string[];
}

export const BLOG_PAGE_SIZE = 10;

export function enumerateFacetPages(
  articles: readonly BlogFacetInput[],
): Map<string, FacetPage> {
  const pages = new Map<string, FacetPage>();

  for (const article of articles) {
    const perToken = article.tags.map((token) => [null, ...tagAncestors(token)] as (string | null)[]);
    for (const combo of cartesian(perToken)) {
      const chosen = combo.filter((f): f is string => f !== null);
      if (chosen.length === 0) continue;
      const facets = canonicalizeFacetSet(chosen);
      const tagset = encodeTagset(facets);
      let page = pages.get(tagset);
      if (!page) {
        page = { tagset, facets, slugs: [] };
        pages.set(tagset, page);
      }
      if (!page.slugs.includes(article.slug)) page.slugs.push(article.slug);
    }
  }

  for (const page of pages.values()) {
    page.slugs.sort((a, b) => compareCodePoints(b, a));
  }
  return pages;
}

function cartesian<T>(lists: readonly T[][]): T[][] {
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((prefix) => list.map((item) => [...prefix, item])),
    [[]],
  );
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / BLOG_PAGE_SIZE));
}

export function pageSlice<T>(items: readonly T[], page: number): T[] {
  return items.slice((page - 1) * BLOG_PAGE_SIZE, page * BLOG_PAGE_SIZE);
}

export interface BlogLinkTarget {
  tagset: string;
  /** 1 なら base URL (/page/1 は生成しない) */
  page: number;
}

// 遷移先で対象記事が 2 ページ目以降にある場合もアンカーへ正しく着地させるため、
// リンク先のページ番号はビルド時に算出する (docs/blog-spec.md「リンク遷移ルール」)。
export function locateArticle(
  pages: ReadonlyMap<string, FacetPage>,
  tagset: string,
  slug: string,
): BlogLinkTarget | null {
  const page = pages.get(tagset);
  if (!page) return null;
  const index = page.slugs.indexOf(slug);
  if (index === -1) return null;
  return { tagset, page: Math.floor(index / BLOG_PAGE_SIZE) + 1 };
}

export interface RemainingToken {
  token: string;
  /** 表示ラベル: 現在ページが親ファセットを含む階層タグは残りセグメントのみ */
  label: string;
}

export function remainingTokens(
  tokens: readonly string[],
  pageFacets: readonly string[],
): RemainingToken[] {
  const page = new Set(pageFacets);
  const result: RemainingToken[] = [];
  for (const token of tokens) {
    if (page.has(token)) continue; // トークン自体が指定済み
    // 現在ページに含まれる最長の祖先ファセット分を表示から省く
    const covered = tagAncestors(token)
      .filter((a) => a !== token && page.has(a))
      .sort((a, b) => b.length - a.length)[0];
    result.push({ token, label: covered ? token.slice(covered.length + 1) : token });
  }
  return result.sort((a, b) => compareCodePoints(a.token, b.token));
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/blog/pages.test.ts`
Expected: PASS

- [ ] **Step 5: コミット**

```bash
git add src/lib/blog/pages.ts tests/lib/blog/pages.test.ts
git commit -m "feat(blog): ファセット集合ページの列挙とリンク先算出を追加"
```

---

### Task 6: タグ共起ツリー (`src/lib/blog/tree.ts`)

**Files:**
- Create: `src/lib/blog/tree.ts`
- Test: `tests/lib/blog/tree.test.ts`

**Interfaces:**
- Consumes: Task 2 の tagset 関数群、Task 5 の `enumerateFacetPages` (lock-step 検証)
- Produces:
  - `interface BlogTreeNode { id: string; label: string; tagset: string; addedFacet: string; children: BlogTreeNode[] }` — `id` は追加ファセット列を `"|"` 連結したパス一意キー、`tagset` はノードのファセット集合の正規形 (リンク先 / アクティブ判定用)
  - `buildBlogTagTree(articles: readonly BlogFacetInput[]): BlogTreeNode[]`
  - `canonicalChainIds(tree: readonly BlogTreeNode[], facets: readonly string[]): string[]` — コールド読み込み時の既定展開 (正規チェーン) のノード id 列
  - `filterBlogTree(tree: readonly BlogTreeNode[], query: string): { tree: BlogTreeNode[]; matchedIds: string[] }`

- [ ] **Step 1: 失敗するテストを書く** (`tests/lib/blog/tree.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import { enumerateFacetPages } from "@/lib/blog/pages.ts";
import {
  buildBlogTagTree,
  canonicalChainIds,
  filterBlogTree,
  type BlogTreeNode,
} from "@/lib/blog/tree.ts";

const imageA = [
  { slug: "2025-12-11 0930", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-10-29 1400", tags: ["UI-UX", "デザインシステム"] },
  { slug: "2025-07-24 0800", tags: ["UI-UX"] },
  { slug: "2025-02-14 0930", tags: ["映画", "スターウォーズ"] },
];

function labels(nodes: readonly BlogTreeNode[]): string[] {
  return nodes.map((n) => n.label);
}

function find(nodes: readonly BlogTreeNode[], label: string): BlogTreeNode {
  const hit = nodes.find((n) => n.label === label);
  if (!hit) throw new Error(`node not found: ${label}`);
  return hit;
}

describe("buildBlogTagTree (仕様イメージ A)", () => {
  const tree = buildBlogTagTree(imageA);

  it("トップレベルは昇格した深さ 1 ファセットのコードポイント昇順", () => {
    expect(labels(tree)).toEqual([
      "UI-UX",
      "スターウォーズ",
      "デザインシステム",
      "マイクロコピー",
      "ライティング",
      "映画",
    ]);
  });

  it("共起の順列を最下層まで完全展開する", () => {
    const uiux = find(tree, "UI-UX");
    expect(labels(uiux.children)).toEqual(["デザインシステム", "マイクロコピー", "ライティング"]);
    const micro = find(uiux.children, "マイクロコピー");
    expect(labels(micro.children)).toEqual(["ライティング"]);
    // 逆順の枝も存在する (意図的な重複 = 回遊性)
    const writing = find(tree, "ライティング");
    expect(labels(writing.children)).toEqual(["UI-UX", "マイクロコピー"]);
  });

  it("リンク先はツリー上の順列に関わらず正規形 tagset", () => {
    const uiux = find(tree, "UI-UX");
    const micro = find(uiux.children, "マイクロコピー");
    const writing = find(micro.children, "ライティング");
    expect(writing.tagset).toBe("UI-UX+マイクロコピー+ライティング");
    // 逆順の枝も同じ tagset に収束
    const w = find(tree, "ライティング");
    const u = find(w.children, "UI-UX");
    expect(find(u.children, "マイクロコピー").tagset).toBe("UI-UX+マイクロコピー+ライティング");
  });

  it("ツリーノードが実現する集合 = 生成ページ集合 (lock-step、仕様 L144)", () => {
    const fromTree = new Set<string>();
    const walk = (nodes: readonly BlogTreeNode[]) => {
      for (const n of nodes) {
        fromTree.add(n.tagset);
        walk(n.children);
      }
    };
    walk(tree);
    const fromPages = new Set(enumerateFacetPages(imageA).keys());
    expect(fromTree).toEqual(fromPages);
  });
});

describe("buildBlogTagTree (仕様イメージ A2: 階層タグ)", () => {
  // source A = フラット共起、source B = 階層タグ
  const tree = buildBlogTagTree([
    { slug: "2025-01-02 0900", tags: ["UI-UX", "デザインシステム"] },
    { slug: "2025-01-01 0900", tags: ["UI-UX/デザインシステム"] },
  ]);

  it("葉セグメントはトップに昇格しない (source B 単独では デザインシステム は出ない)", () => {
    // source A のフラット #デザインシステム があるためトップに出るが、
    // その配下は共起 (UI-UX) のみで、階層由来の枝はない
    expect(labels(tree)).toEqual(["UI-UX", "デザインシステム"]);
    const ds = find(tree, "デザインシステム");
    expect(labels(ds.children)).toEqual(["UI-UX"]);
    expect(find(ds.children, "UI-UX").tagset).toBe("UI-UX+デザインシステム");
  });

  it("UI-UX 配下には階層子と共起子の同名ノードが 2 つ並ぶ (階層が先)", () => {
    const uiux = find(tree, "UI-UX");
    expect(labels(uiux.children)).toEqual(["デザインシステム", "デザインシステム"]);
    expect(uiux.children[0]!.tagset).toBe("UI-UX--デザインシステム"); // 階層 (U < デ)
    expect(uiux.children[1]!.tagset).toBe("UI-UX+デザインシステム");  // 共起
    expect(uiux.children[0]!.id).not.toBe(uiux.children[1]!.id);
  });
});

describe("canonicalChainIds", () => {
  it("正規チェーン上のノード id を先頭から返す", () => {
    const tree = buildBlogTagTree(imageA);
    const ids = canonicalChainIds(tree, ["UI-UX", "マイクロコピー", "ライティング"]);
    expect(ids).toEqual([
      "UI-UX",
      "UI-UX|マイクロコピー",
      "UI-UX|マイクロコピー|ライティング",
    ]);
  });

  it("階層ファセットは根 → 降下の 2 段を経由する", () => {
    const tree = buildBlogTagTree([{ slug: "2025-01-01 0900", tags: ["UI-UX/デザインシステム"] }]);
    expect(canonicalChainIds(tree, ["UI-UX/デザインシステム"])).toEqual([
      "UI-UX",
      "UI-UX|UI-UX/デザインシステム",
    ]);
  });
});

describe("filterBlogTree", () => {
  it("ラベル部分一致でフィルタし、一致ノードの祖先を温存する", () => {
    const tree = buildBlogTagTree(imageA);
    const { tree: filtered, matchedIds } = filterBlogTree(tree, "ライティング");
    expect(labels(filtered)).toContain("ライティング"); // トップ一致
    expect(labels(filtered)).toContain("UI-UX");        // 子孫一致で温存
    expect(matchedIds.length).toBeGreaterThan(0);
  });

  it("空クエリは全ツリーを返す", () => {
    const tree = buildBlogTagTree(imageA);
    expect(filterBlogTree(tree, "").tree).toEqual([...tree]);
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/blog/tree.test.ts`
Expected: FAIL (モジュールが存在しない)

- [ ] **Step 3: 実装** (`src/lib/blog/tree.ts`)

```typescript
import { tagAncestors } from "@/lib/tags/index.ts";
import {
  articleFacets,
  canonicalizeFacetSet,
  canonicalTagsetOf,
  compareCodePoints,
} from "./tagset.ts";
import type { BlogFacetInput } from "./pages.ts";

// タグの共起ツリー (docs/blog-spec.md「左サイドメニュー」)。
// 各ノードはファセット集合 (antichain) に対応し、その正規ページへリンクする。
// 順列の重複は「同一集合への複数の入口」として意図的に残す。

export interface BlogTreeNode {
  /** 追加ファセット列を "|" 連結したパス一意キー (展開状態の保持に使う) */
  id: string;
  /** 追加された末尾セグメント */
  label: string;
  /** ノードのファセット集合の正規形 (リンク先 URL / アクティブ判定) */
  tagset: string;
  addedFacet: string;
  children: BlogTreeNode[];
}

interface ArticleFacets {
  facetSet: ReadonlySet<string>;
}

export function buildBlogTagTree(articles: readonly BlogFacetInput[]): BlogTreeNode[] {
  const witnesses: ArticleFacets[] = articles.map((a) => ({
    facetSet: new Set(articleFacets(a.tags)),
  }));

  // 昇格 = トークンのフラットまたは根として出現した深さ 1 ファセット。
  // 葉セグメント単独は昇格しない (トークンの根だけを集めれば十分)。
  const promotedRoots = new Set<string>();
  // 階層降下の候補: 出現した深さ 2 ファセット (= 深さ 2 トークン) を根ごとに引く
  const depth2ByRoot = new Map<string, Set<string>>();
  for (const article of articles) {
    for (const token of article.tags) {
      const [root] = token.split("/") as [string];
      promotedRoots.add(root);
      if (token.includes("/")) {
        const set = depth2ByRoot.get(root) ?? new Set<string>();
        set.add(token);
        depth2ByRoot.set(root, set);
      }
    }
  }

  const hasArticle = (facets: readonly string[]): boolean =>
    witnesses.some((w) => facets.every((f) => w.facetSet.has(f)));

  const buildChildren = (facets: readonly string[], parentId: string): BlogTreeNode[] => {
    const candidates: { addedFacet: string; nextFacets: string[] }[] = [];

    // 階層降下 (有向): S 内の深さ 1 ファセット A を A/B に深める
    for (const facet of facets) {
      if (facet.includes("/")) continue;
      for (const deeper of depth2ByRoot.get(facet) ?? []) {
        const nextFacets = canonicalizeFacetSet([...facets.filter((f) => f !== facet), deeper]);
        if (hasArticle(nextFacets)) candidates.push({ addedFacet: deeper, nextFacets });
      }
    }

    // 共起追加 (順列): S に別トークンの根ファセット D を足す
    for (const root of promotedRoots) {
      // antichain を保つ: S 内に root 自身や root 配下のファセットがあればスキップ
      if (facets.some((f) => f === root || f.startsWith(`${root}/`))) continue;
      const nextFacets = canonicalizeFacetSet([...facets, root]);
      if (hasArticle(nextFacets)) candidates.push({ addedFacet: root, nextFacets });
    }

    // 兄弟は追加ファセットの論理パス文字列のコードポイント昇順 (階層子と共起子共通の 1 規則)
    candidates.sort((a, b) => compareCodePoints(a.addedFacet, b.addedFacet));

    return candidates.map(({ addedFacet, nextFacets }) => {
      const id = parentId === "" ? addedFacet : `${parentId}|${addedFacet}`;
      return {
        id,
        label: lastSegment(addedFacet),
        tagset: canonicalTagsetOf(nextFacets),
        addedFacet,
        children: buildChildren(nextFacets, id),
      };
    });
  };

  return [...promotedRoots]
    .sort(compareCodePoints)
    .map((root) => ({
      id: root,
      label: root,
      tagset: canonicalTagsetOf([root]),
      addedFacet: root,
      children: buildChildren([root], root),
    }));
}

function lastSegment(facet: string): string {
  const idx = facet.lastIndexOf("/");
  return idx === -1 ? facet : facet.slice(idx + 1);
}

// コールド読み込み時の既定展開: 現在集合の正規チェーンのみを開く (docs/blog-spec.md「ツリーの挙動」)。
// 正規順のファセットを 1 つずつ加える経路で、階層ファセットは根の共起追加 → 階層降下の 2 段を経由する。
export function canonicalChainIds(
  tree: readonly BlogTreeNode[],
  facets: readonly string[],
): string[] {
  const ids: string[] = [];
  let nodes = tree;
  let id = "";
  for (const facet of facets) {
    const steps = facet.includes("/") ? [tagAncestors(facet)[0]!, facet] : [facet];
    for (const step of steps) {
      const next = nodes.find((n) => n.addedFacet === step);
      if (!next) return ids; // フィルタ中などで枝が見つからなければそこまでを返す
      id = next.id;
      ids.push(id);
      nodes = next.children;
    }
  }
  return ids;
}

export function filterBlogTree(
  tree: readonly BlogTreeNode[],
  query: string,
): { tree: BlogTreeNode[]; matchedIds: string[] } {
  const q = query.trim().toLowerCase();
  if (q === "") return { tree: [...tree], matchedIds: [] };

  const matchedIds: string[] = [];
  const walk = (nodes: readonly BlogTreeNode[]): BlogTreeNode[] => {
    const kept: BlogTreeNode[] = [];
    for (const node of nodes) {
      const selfMatch = node.label.toLowerCase().includes(q);
      const children = walk(node.children);
      if (selfMatch) {
        // 一致ノードは配下をそのまま見せる (既存 filterTree と同方針)
        kept.push(node);
      } else if (children.length > 0) {
        matchedIds.push(node.id);
        kept.push({ ...node, children });
      }
    }
    return kept;
  };
  return { tree: walk(tree), matchedIds };
}
```

- [ ] **Step 4: テストが通ることを確認**

Run: `npx vitest run tests/lib/blog/tree.test.ts`
Expected: PASS。イメージ A の完全展開 (仕様 L177-200) と一致しない場合は候補生成・ソートを仕様と突き合わせる

- [ ] **Step 5: コミット**

```bash
git add src/lib/blog/tree.ts tests/lib/blog/tree.test.ts
git commit -m "feat(blog): タグ共起ツリーの構築・フィルタ純関数を追加"
```

---

### Task 7: Markdown レンダリング — id 名前空間と renderBlog

複数記事を 1 ページに連結するため、脚注 id (`user-content-fn-1`)・callout id (`callout-1`)・見出し slug が記事間で衝突する。記事アンカー (`p-2025-12-11-0930`) 由来のプレフィックスで名前空間を分ける。

**方式** (3 点セット):
1. remark-rehype の `clobberPrefix` を記事ごとに `${anchorId}-` にする → 脚注参照 `<a href="#p-…-fn-1">` / backref id が記事ごとに一意になる
2. 新規 rehype プラグイン `prefixIds` — rehype-slug 直後に走り、**プレフィックスで始まらない** `id` 属性と `#` 始まりの `href` にプレフィックスを付与 (見出し slug・callout id を捕捉。clobber 済み脚注参照は開始一致でスキップされる)
3. `applyFootnote` に `idPrefix` を追加 — raw HTML として挿入される `.footnote-aside` の id は hast プラグインで書き換えられないため、生成時にプレフィックスを織り込む

`FootnoteSection` (React 側) は Task 9 で `idPrefix` prop (デフォルト `"user-content-"`) を受ける。

**Files:**
- Create: `src/lib/markdown/plugins/prefix-ids.ts`
- Modify: `src/lib/markdown/plugins/footnote.ts` (`FootnoteContext` に `idPrefix?: string`、L63 の aside id 生成)
- Modify: `src/lib/markdown/pipeline.ts` (`RenderContentSpec.idPrefix?`、`createFinalRenderer(prefix?)`、`renderBlog`、`pickBlogTitle`)
- Modify: `src/lib/markdown/index.ts` (`renderBlog` / `pickBlogTitle` re-export)
- Test: `tests/lib/markdown/prefixIds.test.ts`、`tests/lib/markdown/renderBlog.test.ts`

**Interfaces:**
- Consumes: `ContentItem<BlogFrontmatter>`、`parseBlogSlugDate` (anchorId)、`blogArticleTitle`
- Produces:
  - `rehypePrefixIds(options: { prefix: string })` — unified プラグイン
  - `renderBlog(items: ContentItem<BlogFrontmatter>[], config: SiteConfigParsed, index?: ContentIndex): Promise<RenderedBlogArticle[]>` — 記事ごとに `idPrefix = anchorId + "-"` でレンダリング。`incomingLinks` は常に空 (Blog はリンクの受け手にならない)
  - `pickBlogTitle` — `blogArticleTitle(item.frontmatter.tags)` を返す
  - `RenderContentSpec<F>` に `idPrefix?: (item: ContentItem<F>) => string` (省略時は従来挙動 = 既存 3 タイプに影響なし)

- [ ] **Step 1: 失敗するテストを書く** (`tests/lib/markdown/prefixIds.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import { unified } from "unified";
import { rehypePrefixIds } from "@/lib/markdown/plugins/prefix-ids.ts";

async function render(md: string, prefix: string): Promise<string> {
  const out = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true, clobberPrefix: prefix })
    .use(rehypeSlug)
    .use(rehypePrefixIds, { prefix })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(out);
}

describe("rehypePrefixIds", () => {
  it("見出し id にプレフィックスを付与する", async () => {
    const html = await render("## Hello", "p-2025-12-11-0930-");
    expect(html).toContain('id="p-2025-12-11-0930-hello"');
  });

  it("clobberPrefix 済みの脚注 id は二重プレフィックスしない", async () => {
    const html = await render("text[^1]\n\n[^1]: note", "p-x-");
    expect(html).toContain('href="#p-x-fn-1"');
    expect(html).not.toContain("p-x-p-x-");
  });

  it("# 始まりの内部 href にもプレフィックスを付与する", async () => {
    const html = await render("[jump](#hello)\n\n## Hello", "p-x-");
    expect(html).toContain('href="#p-x-hello"');
  });
});
```

`tests/lib/markdown/renderBlog.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { collectBlog } from "@/lib/content/index.ts";
import { renderBlog } from "@/lib/markdown/index.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("renderBlog", () => {
  it("記事ごとに anchorId 由来の id 名前空間でレンダリングする", async () => {
    const config = makeConfig("vault");
    const items = await collectBlog(config);
    const rendered = await renderBlog(items, config);
    const withFootnote = rendered.find((r) => r.slug === "2025-02-14 0930");
    expect(withFootnote).toBeDefined();
    // 脚注参照が記事固有の id 空間を指す
    expect(withFootnote!.html).toContain("#p-2025-02-14-0930-fn-");
    // Marginalia の data-side が付与されている (記事単位で document order 初期化)
    expect(withFootnote!.html).toContain('data-side="right"');
    // Blog はリンクの受け手にならない
    expect(rendered.every((r) => r.incomingLinks.length === 0)).toBe(true);
  });

  it("タイトルはタグ併記の正規形になる", async () => {
    const config = makeConfig("vault");
    const rendered = await renderBlog(await collectBlog(config), config);
    const top = rendered.find((r) => r.slug === "2025-12-11 0930");
    expect(top!.title).toBe("#UI-UX#マイクロコピー#ライティング");
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/markdown/prefixIds.test.ts tests/lib/markdown/renderBlog.test.ts`
Expected: FAIL

- [ ] **Step 3: `rehypePrefixIds` を実装** (`src/lib/markdown/plugins/prefix-ids.ts`)

```typescript
import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";

// 複数記事を 1 ページに連結する Blog では、rehype-slug の見出し id や callout id が
// 記事間で衝突する。記事アンカー由来のプレフィックスで id / フラグメント href を
// 名前空間化する。remark-rehype の clobberPrefix で既に付与済みの id (脚注参照) は
// 開始一致で判定して二重付与を避ける。
//
// 注意: type: "html" の raw ノード (footnote-aside 等) はここを通らないため、
// 生成元 (applyFootnote) が idPrefix を織り込む。
export interface PrefixIdsOptions {
  prefix: string;
}

export function rehypePrefixIds(options: PrefixIdsOptions) {
  const { prefix } = options;
  return (tree: Root): void => {
    visit(tree, "element", (node: Element) => {
      const id = node.properties["id"];
      if (typeof id === "string" && !id.startsWith(prefix)) {
        node.properties["id"] = `${prefix}${id}`;
      }
      const href = node.properties["href"];
      if (typeof href === "string" && href.startsWith("#") && !href.startsWith(`#${prefix}`)) {
        node.properties["href"] = `#${prefix}${href.slice(1)}`;
      }
    });
  };
}
```

- [ ] **Step 4: `applyFootnote` に idPrefix を追加** (`src/lib/markdown/plugins/footnote.ts`)

`FootnoteContext` に `idPrefix?: string` を追加し、L63 の aside id 生成を変更:

```typescript
export interface FootnoteContext {
  footnotes: FootnoteEntry[];
  renderHtml: (subtree: Root) => Promise<string>;
  /** 複数記事を同一ページに載せる Blog 用の id 名前空間。省略時は remark-rehype 既定と同じ */
  idPrefix?: string;
}
```

L63 を:

```typescript
    const asidePrefix = ctx.idPrefix ?? "user-content-";
    const asideHtml = `<aside class="footnote-aside" id="${asidePrefix}fn-aside-${ordinal}"${sideAttr} role="note">${html}</aside>`;
```

(`asidePrefix` の宣言は `visitParents` コールバックの外、`pending` 宣言付近に置く)

- [ ] **Step 5: pipeline を拡張** (`src/lib/markdown/pipeline.ts`)

1. `RenderContentSpec<F>` に追加:

```typescript
  /** 記事ごとの id 名前空間 (Blog 用)。返り値は "p-2025-12-11-0930-" のような末尾 "-" 付き */
  idPrefix?: (item: ContentItem<F>) => string;
```

2. `createFinalRenderer` をプレフィックス対応にする (rehype-slug の直後に prefixIds):

```typescript
function createFinalRenderer(idPrefix?: string): AnyProcessor {
  const processor = unified()
    .use(remarkGfm)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      ...(idPrefix === undefined ? {} : { clobberPrefix: idPrefix }),
    })
    .use(rehypeSlug)
    .use(...(idPrefix === undefined ? [noopPlugin] : [rehypePrefixIds, { prefix: idPrefix }]))
    .use(rehypeSectionize)
    .use(rehypeShiki, SHIKI_OPTIONS)
    .use(rehypeStringify, { allowDangerousHtml: true });
  return processor as unknown as AnyProcessor;
}
```

`noopPlugin` の条件分岐が煩雑なら、`idPrefix` あり/なしでプロセッサ組み立てを素直に if 分岐してよい (可読性優先)。

3. `renderContentDrafts` のループ内 (L103-108 付近) を変更:

```typescript
    const prefix = spec.idPrefix?.(item);

    await applyFootnote(tree, {
      footnotes,
      renderHtml: (subtree) => renderSubtree(subRenderer, subtree),
      ...(prefix === undefined ? {} : { idPrefix: prefix }),
    });

    const renderer = prefix === undefined ? finalRenderer : createFinalRenderer(prefix);
    const html = await renderSubtree(renderer, tree);
```

(`finalRenderer` はループ外で従来通り 1 回生成。prefix ありの場合のみ記事ごとに生成する — Blog の記事数規模ではコスト無視できる)

4. `renderBlog` / `pickBlogTitle` を追加 (`renderBooks` の後):

```typescript
export const pickBlogTitle = (item: ContentItem<BlogFrontmatter>): string =>
  blogArticleTitle(item.frontmatter.tags);

// Blog はリンクの受け手にならない (docs/blog-spec.md「リンクグラフへの参加」)。
// index には Notes / Glossary / Books のみを登録し、backlinks は配線しない。
export async function renderBlog(
  items: ContentItem<BlogFrontmatter>[],
  config: SiteConfigParsed,
  index?: ContentIndex,
): Promise<RenderedBlogArticle[]> {
  const drafts = await renderContentDrafts<BlogFrontmatter>({
    items,
    config,
    index: index ?? buildContentIndex([]),
    pickTitle: pickBlogTitle,
    idPrefix: (item) => `${parseBlogSlugDate(item.slug, "+00:00")!.anchorId}-`,
  });
  return drafts.map((draft) => ({ ...draft, incomingLinks: [] }));
}
```

import 追加: `parseBlogSlugDate` (`@/lib/blog/filename.ts`)、`blogArticleTitle` (`@/lib/blog/tagset.ts`)、`rehypePrefixIds` (`./plugins/prefix-ids.ts`)、型 `BlogFrontmatter` / `RenderedBlogArticle` (`@/types/content.ts`)。

注意: `pickTitle` のシグネチャは `(item, tree) => string`。`pickBlogTitle` は tree を使わないが同シグネチャに合わせる。

- [ ] **Step 6: 公開 API に追加** (`src/lib/markdown/index.ts`)

`renderBlog` / `pickBlogTitle` / `RenderedBlogArticle` を既存の並びで re-export。

- [ ] **Step 7: テスト + 全体検証**

Run: `npx vitest run tests/lib/markdown/`
Expected: PASS (既存の renderNotes / renderGlossary / renderBooks テストも回帰なし = idPrefix 省略時の挙動が不変)

Run: `npm run typecheck && npm run lint && npm run test`
Expected: グリーン

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "feat(blog): 記事単位の id 名前空間と renderBlog を追加"
```

---

### Task 8: サーバ層 — datasets 統合・Blog モデル・loaders

**Files:**
- Modify: `src/server/datasets.ts` (`SiteDataset.blog` 追加、collect / render 統合)
- Create: `src/server/blog.ts` (Blog モデルの memoize + DTO 射影)
- Modify: `src/server/loaders.ts` (`getBlogTreeData` / `getBlogIndexData` / `getBlogTagsetData`)
- Modify: `src/server/index.ts` (re-export)
- Test: `tests/server/blog.test.ts`

**Interfaces:**
- Consumes: `collectBlog`、`renderBlog`、Task 2/3/5/6 の純関数、`getSiteDataset` の既存キャッシュ機構
- Produces:
  - `SiteDataset.blog: RenderedBlogArticle[]` (slug 降順 = 作成日時降順)
  - `getBlogModel(): Promise<BlogModel>` — `{ articles, bySlug, pages, tree }` を memoize
  - `interface BlogArticleDto { slug; anchorId; displayDate; html; footnotes: FootnoteEntry[]; idPrefix: string; isCanonicalPage: boolean; otherTags: { labels: string[]; tagset: string; page: number } | null }`
  - `interface BlogListPageDto { facets: string[]; tagset: string | null; pageTitle: string | null; breadcrumb: { label: string; tagset: string }[]; page: number; totalPages: number; articles: BlogArticleDto[] }`
  - server fn: `getBlogTreeData(): Promise<BlogTreeNode[]>`、`getBlogIndexData({ data: { page } })`、`getBlogTagsetData({ data: { tagset, page } })` — 後者 2 つは対象がなければ `null` を返し、ルート側で `notFound()` を投げる

- [ ] **Step 1: 失敗するテストを書く** (`tests/server/blog.test.ts`)

既存の `tests/server/glossary.test.ts` の config 差し替えパターン (`__setConfigForTests` 相当 / `__resetSiteDatasetForTests`) を踏襲する。

```typescript
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { makeConfig } from "../helpers/makeConfig.ts";
// 注: フック名は src/server/datasets.ts の既存 export に合わせる
import { __resetSiteDatasetForTests, __setSiteDatasetConfigForTests } from "@/server/datasets.ts";
import { getBlogModel, projectBlogListPage } from "@/server/blog.ts";

beforeEach(() => {
  __setSiteDatasetConfigForTests(makeConfig("vault"));
});
afterEach(() => {
  __resetSiteDatasetForTests();
});

describe("getBlogModel", () => {
  it("公開記事を作成日時降順で保持する", async () => {
    const model = await getBlogModel();
    expect(model.articles.map((a) => a.slug)).toEqual([
      "2025-12-11 0930",
      "2025-10-29 1400",
      "2025-07-24 0800",
      "2025-04-09 2145",
      "2025-02-14 0930",
    ]);
  });

  it("ページ集合とツリーが lock-step で一致する", async () => {
    const model = await getBlogModel();
    const fromTree = new Set<string>();
    const walk = (nodes: typeof model.tree) => {
      for (const n of nodes) {
        fromTree.add(n.tagset);
        walk(n.children);
      }
    };
    walk(model.tree);
    expect(fromTree).toEqual(new Set(model.pages.keys()));
  });
});

describe("projectBlogListPage", () => {
  it("トップページ: 全記事、それ以外のタグ = 全トークン", async () => {
    const model = await getBlogModel();
    const dto = projectBlogListPage(model, null, 1);
    expect(dto).not.toBeNull();
    expect(dto!.articles).toHaveLength(5);
    const top = dto!.articles[0]!;
    expect(top.otherTags?.labels).toEqual(["UI-UX", "マイクロコピー", "ライティング"]);
    expect(top.otherTags?.tagset).toBe("UI-UX+マイクロコピー+ライティング");
    expect(top.displayDate).toBe("2025/12/11");
    expect(top.anchorId).toBe("p-2025-12-11-0930");
  });

  it("タグ詳細: 絞り込み・省略表示・正規リンク先 (仕様イメージ B / 例 3)", async () => {
    const model = await getBlogModel();
    const dto = projectBlogListPage(model, "UI-UX", 1);
    expect(dto!.articles.map((a) => a.slug)).toEqual([
      "2025-12-11 0930",
      "2025-10-29 1400",
      "2025-07-24 0800",
      "2025-04-09 2145",
    ]);
    const hierarchical = dto!.articles.find((a) => a.slug === "2025-10-29 1400")!;
    // 階層タグは残りセグメントのみ表示、リンク先は冗長祖先を落とした正規形
    expect(hierarchical.otherTags?.labels).toEqual(["デザインシステム"]);
    expect(hierarchical.otherTags?.tagset).toBe("UI-UX--デザインシステム");
    // 「それ以外のタグ」なしの記事 (イメージ B の 2025/07/24)
    expect(dto!.articles.find((a) => a.slug === "2025-07-24 0800")!.otherTags).toBeNull();
  });

  it("パンくずは累積正規チェーン", async () => {
    const model = await getBlogModel();
    const dto = projectBlogListPage(model, "UI-UX+マイクロコピー+ライティング", 1);
    expect(dto!.breadcrumb).toEqual([
      { label: "#UI-UX", tagset: "UI-UX" },
      { label: "#UI-UX#マイクロコピー", tagset: "UI-UX+マイクロコピー" },
      { label: "#UI-UX#マイクロコピー#ライティング", tagset: "UI-UX+マイクロコピー+ライティング" },
    ]);
    expect(dto!.pageTitle).toBe("#UI-UX#マイクロコピー#ライティング");
  });

  it("Pagefind 対象は最も特定的な正規ページのみ", async () => {
    const model = await getBlogModel();
    const onParent = projectBlogListPage(model, "UI-UX", 1)!;
    expect(onParent.articles.find((a) => a.slug === "2025-10-29 1400")!.isCanonicalPage).toBe(false);
    const onCanonical = projectBlogListPage(model, "UI-UX--デザインシステム", 1)!;
    expect(onCanonical.articles[0]!.isCanonicalPage).toBe(true);
  });

  it("非正規 tagset・範囲外ページは null", async () => {
    const model = await getBlogModel();
    expect(projectBlogListPage(model, "映画+スターウォーズ", 1)).toBeNull(); // 非正規順
    expect(projectBlogListPage(model, "存在しない", 1)).toBeNull();
    expect(projectBlogListPage(model, "UI-UX", 2)).toBeNull(); // 4 件しかない
  });
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/server/blog.test.ts`
Expected: FAIL

- [ ] **Step 3: datasets.ts に Blog を統合**

`src/server/datasets.ts` の `build()` を拡張 (既存の Notes / Glossary / Books のパターンに従う):

- `SiteDataset` 型に `blog: RenderedBlogArticle[];` を追加
- `Promise.all` の collect 群に `collectBlog(config)` を追加
- **`buildContentIndex` の入力に blog items は入れない** (Blog はリンク先候補にならない — 仕様 L370)
- `renderContentDrafts<BlogFrontmatter>({ items: blogItems, config, index, pickTitle: pickBlogTitle, idPrefix: (item) => \`${parseBlogSlugDate(item.slug, "+00:00")!.anchorId}-\` })` を既存 3 タイプの render と並べて実行 (または `renderBlog(blogItems, config, index)` を呼ぶ — `renderBlog` が index を受け取れるので後者が簡潔)
- **`buildBacklinks` へ渡す drafts の結合に blog を含めない** (他コンテンツのバックリンク欄に Blog を出さない — 仕様 L371)
- blog 配列は `slug` の文字列降順でソートして格納 (`[...blog].sort((a, b) => (a.slug < b.slug ? 1 : -1))`)
- 画像書換 (`rewriteItemHtml`) は blog にも適用する (本文画像 `![[image.png]]` を使えるため)。`computeImageArtifacts` の入力に blog の `images` も含める

- [ ] **Step 4: `src/server/blog.ts` を実装**

```typescript
import type { FootnoteEntry } from "@/types/content.ts";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";
import {
  articleFacets,
  blogArticleTitle,
  canonicalFullFacetSet,
  canonicalTagsetOf,
  decodeTagset,
  encodeTagset,
} from "@/lib/blog/tagset.ts";
import {
  enumerateFacetPages,
  locateArticle,
  pageCount,
  pageSlice,
  remainingTokens,
  type FacetPage,
} from "@/lib/blog/pages.ts";
import { buildBlogTagTree, type BlogTreeNode } from "@/lib/blog/tree.ts";
import { getResolvedConfig, getSiteDataset } from "./datasets.ts";

export interface BlogArticleModel {
  slug: string;
  anchorId: string;
  displayDate: string;
  createdIso: string;
  updated: string;
  tokens: string[];
  facetSet: ReadonlySet<string>;
  /** この記事の全ファセット集合ページ (最も特定的な正規ページ) の tagset */
  canonicalTagset: string;
  title: string;
  html: string;
  footnotes: FootnoteEntry[];
}

export interface BlogModel {
  articles: BlogArticleModel[];
  bySlug: Map<string, BlogArticleModel>;
  pages: Map<string, FacetPage>;
  tree: BlogTreeNode[];
}

// dataset と同じライフサイクルで memoize する。dataset キャッシュが破棄されたときに
// 追従できるよう、素の dataset 参照をキーに持つ。
let cached: { source: unknown; model: BlogModel } | null = null;

export async function getBlogModel(): Promise<BlogModel> {
  const dataset = await getSiteDataset();
  if (cached && cached.source === dataset) return cached.model;

  const config = getResolvedConfig();
  const timezone = config.content.blog.timezone;

  const articles: BlogArticleModel[] = dataset.blog.map((item) => {
    const date = parseBlogSlugDate(item.slug, timezone)!;
    const tokens = item.frontmatter.tags;
    return {
      slug: item.slug,
      anchorId: date.anchorId,
      displayDate: date.displayDate,
      createdIso: date.createdIso,
      updated: item.frontmatter.updated,
      tokens,
      facetSet: new Set(articleFacets(tokens)),
      canonicalTagset: encodeTagset(canonicalFullFacetSet(tokens)),
      title: item.title,
      html: item.html,
      footnotes: item.footnotes,
    };
  });

  const inputs = articles.map((a) => ({ slug: a.slug, tags: a.tokens }));
  const model: BlogModel = {
    articles,
    bySlug: new Map(articles.map((a) => [a.slug, a])),
    pages: enumerateFacetPages(inputs),
    tree: buildBlogTagTree(inputs),
  };
  cached = { source: dataset, model };
  return model;
}

export interface BlogArticleDto {
  slug: string;
  anchorId: string;
  displayDate: string;
  html: string;
  footnotes: FootnoteEntry[];
  /** FootnoteSection の id 名前空間 (= `${anchorId}-`) */
  idPrefix: string;
  /** 現在ページがこの記事の全ファセット集合ページか (Pagefind のインデックス対象) */
  isCanonicalPage: boolean;
  /** それ以外のタグ (クラスタで 1 リンク)。該当なしは null */
  otherTags: { labels: string[]; tagset: string; page: number } | null;
}

export interface BlogListPageDto {
  /** null = トップページ (/blog) */
  tagset: string | null;
  facets: string[];
  pageTitle: string | null;
  breadcrumb: { label: string; tagset: string }[];
  page: number;
  totalPages: number;
  articles: BlogArticleDto[];
}

// トップ (tagset = null) とタグ詳細を同じ射影で扱う。
// 非正規 tagset・未知の集合・範囲外ページは null (ルート側で notFound)。
export function projectBlogListPage(
  model: BlogModel,
  tagset: string | null,
  page: number,
): BlogListPageDto | null {
  let facets: string[] = [];
  let slugs: string[];

  if (tagset === null) {
    slugs = model.articles.map((a) => a.slug);
  } else {
    if (canonicalTagsetOf(decodeTagset(tagset)) !== tagset) return null; // 非正規は 404
    const facetPage = model.pages.get(tagset);
    if (!facetPage) return null;
    facets = facetPage.facets;
    slugs = facetPage.slugs;
  }

  const totalPages = pageCount(slugs.length);
  if (!Number.isInteger(page) || page < 1 || page > totalPages) return null;

  const articles = pageSlice(slugs, page).map((slug) => {
    const article = model.bySlug.get(slug)!;
    const remaining = remainingTokens(article.tokens, facets);
    let otherTags: BlogArticleDto["otherTags"] = null;
    if (remaining.length > 0) {
      // 遷移先 = canonical(P ∪ R)。トークンを facet として足せば冗長祖先は正規化で落ちる
      const target = canonicalTagsetOf([...facets, ...remaining.map((r) => r.token)]);
      const located = locateArticle(model.pages, target, slug)!;
      otherTags = { labels: remaining.map((r) => r.label), tagset: target, page: located.page };
    }
    return {
      slug: article.slug,
      anchorId: article.anchorId,
      displayDate: article.displayDate,
      html: article.html,
      footnotes: article.footnotes,
      idPrefix: `${article.anchorId}-`,
      isCanonicalPage: tagset !== null && tagset === article.canonicalTagset,
      otherTags,
    };
  });

  // パンくず: 累積正規チェーン (正規リストの先頭からの部分列は常に正規形)
  const breadcrumb = facets.map((_, i) => {
    const subset = facets.slice(0, i + 1);
    return {
      label: subset.map((f) => `#${f}`).join(""),
      tagset: encodeTagset(subset),
    };
  });

  return {
    tagset,
    facets,
    pageTitle: tagset === null ? null : facets.map((f) => `#${f}`).join(""),
    breadcrumb,
    page,
    totalPages,
    articles,
  };
}

export function __resetBlogModelForTests(): void {
  cached = null;
}
```

注意: `getResolvedConfig` が同期関数でない場合は `src/server/datasets.ts` の実際のシグネチャに合わせること (トップページ 6 セクション化の際に追加された export)。

- [ ] **Step 5: loaders を追加** (`src/server/loaders.ts`)

既存の `getNotesTreeData` 等のパターン (handler inline、zod inputValidator) に従い追加:

```typescript
export const getBlogTreeData = createServerFn({ method: "GET" }).handler(async () => {
  const model = await getBlogModel();
  return model.tree;
});

const blogIndexInput = z.object({ page: z.number().int().min(1) });

export const getBlogIndexData = createServerFn({ method: "GET" })
  .inputValidator(blogIndexInput)
  .handler(async ({ data }) => {
    const model = await getBlogModel();
    return projectBlogListPage(model, null, data.page);
  });

const blogTagsetInput = z.object({ tagset: z.string().min(1), page: z.number().int().min(1) });

export const getBlogTagsetData = createServerFn({ method: "GET" })
  .inputValidator(blogTagsetInput)
  .handler(async ({ data }) => {
    const model = await getBlogModel();
    return projectBlogListPage(model, data.tagset, data.page);
  });
```

`BlogArticleDto` / `BlogListPageDto` / `BlogTreeNode` 型を re-export。`inputValidator` の正確なメソッド名・使い方は既存 `getNoteDetailData` (`loaders.ts:85` 付近) に合わせる。

- [ ] **Step 6: テスト + 全体検証**

Run: `npx vitest run tests/server/`
Expected: PASS (既存 server テストの回帰なし)

Run: `npm run typecheck && npm run lint && npm run test`
Expected: グリーン

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat(blog): サーバ層に Blog モデルと loader を追加"
```

---

### Task 9: ルートと記事ブロック UI

**Files:**
- Modify: `src/router.tsx` (`pathParamsAllowedCharacters: ["+"]`)
- Create: `src/routes/blog/route.tsx` / `src/routes/blog/index.tsx` / `src/routes/blog/page/$n.tsx` / `src/routes/blog/tags/$tagset/index.tsx` / `src/routes/blog/tags/$tagset/page/$n.tsx`
- Create: `src/components/blog/BlogArticleBlock.tsx` / `src/components/blog/BlogListPage.tsx` / `src/components/blog/BlogBreadcrumb.tsx`
- Modify: `src/components/content/FootnoteSection.tsx` (`idPrefix?: string` prop、デフォルト `"user-content-"`)
- Modify: `src/styles/content.css` (記事境界の `clear`)
- Test: `tests/components/BlogArticleBlock.test.tsx`

**Interfaces:**
- Consumes: Task 8 の loaders / DTO、`AppShell` (`variant="list"`)、`DetailLayout` (`hasMarginalia`)、`FootnoteSection`、`makeTitle`
- Produces: `/blog` `/blog/page/$n` `/blog/tags/$tagset` `/blog/tags/$tagset/page/$n` の 4 ルート (+ ツリーは Task 10 で差し込み)

- [ ] **Step 1: router に `+` を許可** (`src/router.tsx`)

```typescript
export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // tagset セグメントの集合区切り "+" を percent-encode させない (正規 URL を素の "+" で出す)
    pathParamsAllowedCharacters: ["+"],
  });
}
```

- [ ] **Step 2: FootnoteSection に idPrefix を追加**

`src/components/content/FootnoteSection.tsx` の Props に `idPrefix?: string` を追加し、`<li id={...}>` の id 生成を `` `${idPrefix ?? "user-content-"}fn-${footnote.id}` `` に変更。既存呼び出し (DetailShell) は無変更で挙動不変。

- [ ] **Step 3: 失敗するテストを書く** (`tests/components/BlogArticleBlock.test.tsx`)

既存のコンポーネントテスト (`tests/components/TreeSidebar.test.tsx` 等) の RTL パターンに従う。TanStack の `Link` を含むため、既存テストでルーターをモック/ラップしている方式があればそれを踏襲し、なければ `Link` の描画結果 (`<a href>`) を検証する。

```tsx
// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlogArticleBlock } from "@/components/blog/BlogArticleBlock.tsx";

const base = {
  slug: "2025-12-11 0930",
  anchorId: "p-2025-12-11-0930",
  displayDate: "2025/12/11",
  html: "<p>本文</p>",
  footnotes: [],
  idPrefix: "p-2025-12-11-0930-",
  isCanonicalPage: false,
  otherTags: {
    labels: ["マイクロコピー", "ライティング"],
    tagset: "UI-UX+マイクロコピー+ライティング",
    page: 1,
  },
};

describe("BlogArticleBlock", () => {
  it("作成日見出しにアンカー id を付ける", () => {
    render(<BlogArticleBlock article={base} />);
    const heading = screen.getByRole("heading", { name: "2025/12/11" });
    expect(heading.id).toBe("p-2025-12-11-0930");
  });

  it("それ以外のタグはクラスタで 1 リンク、正規ページ + アンカーへ向く", () => {
    render(<BlogArticleBlock article={base} />);
    const link = screen.getByRole("link", { name: "#マイクロコピー#ライティング" });
    expect(link.getAttribute("href")).toContain("/blog/tags/UI-UX+マイクロコピー+ライティング");
    expect(link.getAttribute("href")).toContain("#p-2025-12-11-0930");
  });

  it("otherTags が null なら併記を出さない", () => {
    render(<BlogArticleBlock article={{ ...base, otherTags: null }} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("isCanonicalPage のときのみ data-pagefind-body を付ける", () => {
    const { container, rerender } = render(<BlogArticleBlock article={base} />);
    expect(container.querySelector("[data-pagefind-body]")).toBeNull();
    rerender(<BlogArticleBlock article={{ ...base, isCanonicalPage: true }} />);
    expect(container.querySelector("[data-pagefind-body]")).not.toBeNull();
  });
});
```

- [ ] **Step 4: テストが失敗することを確認**

Run: `npx vitest run tests/components/BlogArticleBlock.test.tsx`
Expected: FAIL

- [ ] **Step 5: BlogArticleBlock を実装** (`src/components/blog/BlogArticleBlock.tsx`)

```tsx
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { FootnoteSection } from "@/components/content/FootnoteSection.tsx";
import type { BlogArticleDto } from "@/server/loaders.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  article: {
    // Marginalia (float) が前後の記事に流れ込まないよう記事境界で clear する
    clear: "both",
  },
  date: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
    fontWeight: typography.weightMedium,
    marginBottom: space.s1,
  },
  tags: {
    display: "inline-block",
    color: colors.link,
    fontSize: typography.fontSizeSm,
    textDecoration: { default: "none", ":hover": "underline" },
    marginBottom: space.s2,
  },
});

interface BlogArticleBlockProps {
  article: BlogArticleDto;
}

export function BlogArticleBlock({ article }: BlogArticleBlockProps) {
  const { otherTags } = article;
  return (
    <article {...stylex.props(styles.article)} data-blog-article>
      {/* 作成日を見出しにする: 記事アンカーの対象 + Pagefind sub-result の分割点 */}
      <h2 id={article.anchorId} {...stylex.props(styles.date)}>
        {article.displayDate}
      </h2>
      {otherTags && (
        <Link
          {...(otherTags.page > 1
            ? {
                to: "/blog/tags/$tagset/page/$n" as const,
                params: { tagset: otherTags.tagset, n: String(otherTags.page) },
              }
            : { to: "/blog/tags/$tagset" as const, params: { tagset: otherTags.tagset } })}
          hash={article.anchorId}
          {...stylex.props(styles.tags)}
        >
          {otherTags.labels.map((label) => `#${label}`).join("")}
        </Link>
      )}
      {article.isCanonicalPage ? (
        <div data-content-body data-pagefind-body dangerouslySetInnerHTML={{ __html: article.html }} />
      ) : (
        <div data-content-body dangerouslySetInnerHTML={{ __html: article.html }} />
      )}
      <FootnoteSection footnotes={article.footnotes} idPrefix={article.idPrefix} />
    </article>
  );
}
```

注意:
- `Link` の条件付き props が TanStack Router の型と合わない場合は、page > 1 とそれ以外で `<Link>` を丸ごと分岐する (型安全を優先)
- `params` オブジェクトはレンダーごとに再生成されるため、react-perf lint が警告する場合は既存 `NoteCard` と同様に `useMemo` で安定参照化する

- [ ] **Step 6: BlogBreadcrumb を実装** (`src/components/blog/BlogBreadcrumb.tsx`)

既存 `src/components/common/Breadcrumb.tsx` は root / middle / current の固定 3 段のため、可変長の累積チェーン用に別コンポーネントを作る。マークアップ・スタイルは既存 Breadcrumb を参考に react-aria-components の `Breadcrumbs` / `Breadcrumb` を使う:

```tsx
import * as stylex from "@stylexjs/stylex";
import { Breadcrumb, Breadcrumbs } from "react-aria-components";
import { Link } from "@tanstack/react-router";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const styles = stylex.create({
  nav: {
    marginBottom: space.s4,
  },
  list: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space.s1,
    listStyle: "none",
    margin: 0,
    padding: 0,
    fontSize: typography.fontSizeSm,
  },
  link: {
    color: colors.link,
    textDecoration: { default: "none", ":hover": "underline" },
  },
  current: {
    color: colors.textSecondary,
  },
  separator: {
    color: colors.textMuted,
    userSelect: "none",
  },
});

export interface BlogCrumb {
  label: string;
  tagset: string;
}

interface BlogBreadcrumbProps {
  /** 累積正規チェーン。末尾要素が現在ページ。空配列 = トップ (/blog) */
  items: readonly BlogCrumb[];
}

export function BlogBreadcrumb({ items }: BlogBreadcrumbProps) {
  const last = items.length - 1;
  return (
    <nav aria-label="Breadcrumb" {...stylex.props(styles.nav)}>
      <Breadcrumbs {...stylex.props(styles.list)}>
        <Breadcrumb>
          {items.length === 0 ? (
            <span {...stylex.props(styles.current)}>Blog</span>
          ) : (
            <Link to="/blog" {...stylex.props(styles.link)}>Blog</Link>
          )}
        </Breadcrumb>
        {items.map((item, i) => (
          <Breadcrumb key={item.tagset}>
            <span aria-hidden="true" {...stylex.props(styles.separator)}>›</span>{" "}
            {i === last ? (
              <span {...stylex.props(styles.current)}>{item.label}</span>
            ) : (
              <Link to="/blog/tags/$tagset" params={{ tagset: item.tagset }} {...stylex.props(styles.link)}>
                {item.label}
              </Link>
            )}
          </Breadcrumb>
        ))}
      </Breadcrumbs>
    </nav>
  );
}
```

(RAC `Breadcrumbs` の正しい構造 — `Breadcrumb` 内に separator を含める書き方 — は既存 `Breadcrumb.tsx` の実装に合わせて調整する)

- [ ] **Step 7: BlogListPage を実装** (`src/components/blog/BlogListPage.tsx`)

トップ / タグ詳細 / 各ページネーションページが共有するページ本体。`AppShell` は各ルートが組む (ツリー sidebar は Task 10 まで `null`):

```tsx
import { Fragment } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { DetailLayout } from "@/components/layout/DetailLayout.tsx";
import type { BlogListPageDto } from "@/server/loaders.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { BlogArticleBlock } from "./BlogArticleBlock.tsx";
import { BlogBreadcrumb } from "./BlogBreadcrumb.tsx";

const styles = stylex.create({
  title: {
    fontSize: typography.fontSize2xl,
    fontWeight: typography.weightSemibold,
    marginBottom: space.s6,
    overflowWrap: "anywhere",
  },
  divider: {
    clear: "both", // 前の記事の Marginalia を跨がない
    border: "none",
    borderTop: `1px solid ${colors.borderSubtle}`,
    marginBlock: space.s6,
  },
  pager: {
    clear: "both",
    display: "flex",
    justifyContent: "space-between",
    marginTop: space.s7,
    fontSize: typography.fontSizeSm,
  },
  pagerLink: {
    color: colors.link,
    textDecoration: { default: "none", ":hover": "underline" },
  },
});

interface BlogListPageProps {
  data: BlogListPageDto;
}

export function BlogListPage({ data }: BlogListPageProps) {
  const hasMarginalia = data.articles.some((a) => a.footnotes.length > 0 || a.html.includes("data-callout"));
  const prev = data.page - 1;
  const next = data.page + 1;
  return (
    <DetailLayout hasMarginalia={hasMarginalia}>
      <BlogBreadcrumb items={data.breadcrumb} />
      {data.pageTitle && <h1 {...stylex.props(styles.title)}>{data.pageTitle}</h1>}
      {data.articles.map((article, i) => (
        <Fragment key={article.slug}>
          {i > 0 && <hr {...stylex.props(styles.divider)} />}
          <BlogArticleBlock article={article} />
        </Fragment>
      ))}
      {(prev >= 1 || next <= data.totalPages) && (
        <nav aria-label="Pagination" {...stylex.props(styles.pager)}>
          <span>{prev >= 1 && <PagerLink tagset={data.tagset} page={prev} label="← 前へ" />}</span>
          <span>{next <= data.totalPages && <PagerLink tagset={data.tagset} page={next} label="次へ →" />}</span>
        </nav>
      )}
    </DetailLayout>
  );
}

// 1 ページ目は常に base URL (/page/1 は生成しない)
function PagerLink({ tagset, page, label }: { tagset: string | null; page: number; label: string }) {
  if (tagset === null) {
    return page === 1
      ? <Link to="/blog" {...stylex.props(styles.pagerLink)}>{label}</Link>
      : <Link to="/blog/page/$n" params={{ n: String(page) }} {...stylex.props(styles.pagerLink)}>{label}</Link>;
  }
  return page === 1
    ? <Link to="/blog/tags/$tagset" params={{ tagset }} {...stylex.props(styles.pagerLink)}>{label}</Link>
    : <Link to="/blog/tags/$tagset/page/$n" params={{ tagset, n: String(page) }} {...stylex.props(styles.pagerLink)}>{label}</Link>;
}
```

注意: `hasMarginalia` の `data-callout` 文字列判定が粗い場合は、DTO に `hasMarginalia: boolean` を持たせて projection 側 (Task 8 の `projectBlogListPage`) で判定してもよい。その場合は Task 8 の DTO を拡張する。

- [ ] **Step 8: content.css に記事境界の clear を追加** (`src/styles/content.css`)

`@layer components` 内に追加:

```css
/* Blog: 記事ブロック境界で float (Marginalia) を切り、前後の記事と混ざらないようにする */
[data-blog-article] {
  clear: both;
}
```

- [ ] **Step 9: ルートを実装**

`src/routes/blog/route.tsx` (親レイアウト。ツリー loader + Blog feed の autodiscovery):

```tsx
import { Outlet, createFileRoute } from "@tanstack/react-router";
import { getBlogTreeData } from "@/server/loaders.ts";
import { SITE_URL } from "@/lib/config/static.ts";

export const Route = createFileRoute("/blog")({
  loader: () => getBlogTreeData(),
  head: () => ({
    links: [
      { rel: "alternate", type: "application/atom+xml", href: `${SITE_URL}/blog/feed.xml`, title: "Blog feed" },
    ],
  }),
  component: BlogLayout,
});

function BlogLayout() {
  return <Outlet />;
}
```

`src/routes/blog/index.tsx`:

```tsx
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx"; // Task 10 で作成。それまでは treeSidebar を省略
import { getBlogIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

export const Route = createFileRoute("/blog/")({
  loader: async () => {
    const data = await getBlogIndexData({ data: { page: 1 } });
    if (data === null) throw notFound();
    return data;
  },
  head: () => ({
    meta: [
      { title: makeTitle("Blog") },
      { name: "description", content: "タグの組み合わせで回遊するブログ。" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const data = Route.useLoaderData();
  const tree = useLoaderData({ from: "/blog" });
  return (
    <AppShell
      variant="list"
      treeSidebar={<BlogTagTreeSidebar tree={tree} currentTagset={null} />}
    >
      <BlogListPage data={data} />
    </AppShell>
  );
}
```

`src/routes/blog/page/$n.tsx` (n は 2 以上の整数のみ。それ以外は notFound):

```tsx
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { getBlogIndexData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

function parsePageParam(n: string): number | null {
  if (!/^[2-9]\d*$/.test(n)) return null; // 1 は /blog に正規化 (生成しない)、0 埋め・非数値も 404
  return Number(n);
}

export const Route = createFileRoute("/blog/page/$n")({
  loader: async ({ params }) => {
    const page = parsePageParam(params.n);
    if (page === null) throw notFound();
    const data = await getBlogIndexData({ data: { page } });
    if (data === null) throw notFound();
    return data;
  },
  head: ({ params }) => ({ meta: [{ title: makeTitle(`Blog — page ${params.n}`) }] }),
  component: BlogPageN,
});

function BlogPageN() {
  const data = Route.useLoaderData();
  const tree = useLoaderData({ from: "/blog" });
  return (
    <AppShell variant="list" treeSidebar={<BlogTagTreeSidebar tree={tree} currentTagset={null} />}>
      <BlogListPage data={data} />
    </AppShell>
  );
}
```

`src/routes/blog/tags/$tagset/index.tsx`:

```tsx
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { getBlogTagsetData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

export const Route = createFileRoute("/blog/tags/$tagset/")({
  loader: async ({ params }) => {
    const data = await getBlogTagsetData({ data: { tagset: params.tagset, page: 1 } });
    if (data === null) throw notFound();
    return data;
  },
  head: ({ loaderData }) => ({
    meta: [{ title: makeTitle(loaderData?.pageTitle ?? "Blog") }],
  }),
  component: BlogTagsetPage,
});

function BlogTagsetPage() {
  const data = Route.useLoaderData();
  const tree = useLoaderData({ from: "/blog" });
  return (
    <AppShell
      variant="list"
      treeSidebar={<BlogTagTreeSidebar tree={tree} currentTagset={data.tagset} />}
    >
      <BlogListPage data={data} />
    </AppShell>
  );
}
```

`src/routes/blog/tags/$tagset/page/$n.tsx` (`parsePageParam` は重複させず `src/lib/blog/pages.ts` に移し、`blog/page/$n.tsx` と共用する):

```tsx
import { createFileRoute, notFound, useLoaderData } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { BlogListPage } from "@/components/blog/BlogListPage.tsx";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { parsePageParam } from "@/lib/blog/pages.ts";
import { getBlogTagsetData } from "@/server/loaders.ts";
import { makeTitle } from "@/lib/seo/title.ts";

export const Route = createFileRoute("/blog/tags/$tagset/page/$n")({
  loader: async ({ params }) => {
    const page = parsePageParam(params.n);
    if (page === null) throw notFound();
    const data = await getBlogTagsetData({ data: { tagset: params.tagset, page } });
    if (data === null) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => ({
    meta: [{ title: makeTitle(`${loaderData?.pageTitle ?? "Blog"} — page ${params.n}`) }],
  }),
  component: BlogTagsetPageN,
});

function BlogTagsetPageN() {
  const data = Route.useLoaderData();
  const tree = useLoaderData({ from: "/blog" });
  return (
    <AppShell
      variant="list"
      treeSidebar={<BlogTagTreeSidebar tree={tree} currentTagset={data.tagset} />}
    >
      <BlogListPage data={data} />
    </AppShell>
  );
}
```

Task 10 まで `BlogTagTreeSidebar` が存在しないため、このタスクの時点では各ルートの `treeSidebar` を一旦省略 (`<AppShell variant="list">` のみ) にして typecheck を通し、Task 10 で差し込む。

- [ ] **Step 10: テスト + dev 確認**

Run: `npx vitest run tests/components/BlogArticleBlock.test.tsx`
Expected: PASS

Run: `npm run typecheck && npm run lint && npm run test`
Expected: グリーン

Run: `VAULT_ROOT=$PWD/tests/fixtures/vault npm run dev` (バックグラウンド起動)
確認:
- `curl -s http://localhost:3000/blog | grep "2025/12/11"` → 記事が出る
- `curl -s "http://localhost:3000/blog/tags/UI-UX" | grep "デザインシステム"` → 階層タグ記事が親ファセットで拾われる
- `curl -s "http://localhost:3000/blog/tags/UI-UX--デザインシステム"` → 200 相当の HTML
- `curl -s "http://localhost:3000/blog/tags/映画+スターウォーズ"` → 404 (非正規順)

- [ ] **Step 11: コミット**

```bash
git add -A
git commit -m "feat(blog): ルートと記事ブロック UI を追加"
```

---

### Task 10: タグツリーサイドバー

**Files:**
- Create: `src/components/blog/BlogTagTreeSidebar.tsx`
- Create: `src/lib/blog/treeExpansion.ts`
- Modify: `src/routes/blog/*.tsx` (Task 9 で省略した `treeSidebar` を差し込む)
- Test: `tests/components/BlogTagTreeSidebar.test.tsx`

**Interfaces:**
- Consumes: `BlogTreeNode` / `canonicalChainIds` / `filterBlogTree` (Task 6)、`TreeSearch` (`src/components/tree/TreeSearch.tsx`)、react-aria-components の `Tree` / `TreeItem`
- Produces: `BlogTagTreeSidebar({ tree: readonly BlogTreeNode[]; currentTagset: string | null })`

**設計要点** (docs/blog-spec.md「ツリーの挙動」):
- 各ノードは**リンク** (`href = /blog/tags/${node.tagset}`、常に正規形)。開閉は chevron ボタンで行う (リンクとは独立)
- **アクティブ**: `node.tagset === currentTagset` の**すべての**ノードに付与 (URL から導出するステートレス処理。既存 `ContentTree` の `activeSlug` 単一比較とは異なる)
- **展開状態**: モジュールスコープのストアで保持する。ページ遷移でコンポーネントが remount されても直前の開閉状態を引き継ぎ、「操作していた枝が開いたまま残る」を満たす。コールド読み込み (ストアが空) のときのみ `canonicalChainIds(tree, 現在ファセット)` を既定展開にする
- フィルタ入力 (`TreeSearch` 再利用) で `filterBlogTree`。クエリ非空時は一致ノードの祖先 (`matchedIds`) を自動展開 (既存 `TreeSidebar.tsx:88-103` と同方針)
- 見た目 (インデント・行スタイル・選択色) は `src/components/tree/ContentTree.tsx` の styles を踏襲する

- [ ] **Step 1: 展開ストアを実装** (`src/lib/blog/treeExpansion.ts`)

```typescript
// Blog タグツリーの開閉状態。ルート遷移でサイドバーが remount されても
// 「操作していた枝が開いたまま残る」(docs/blog-spec.md) を満たすため、
// モジュールスコープに退避する。SSR では毎リクエスト新規モジュールにはならないが、
// 初期描画はコールド既定展開 (正規チェーン) を使うため実害はない。
let stored: ReadonlySet<string> | null = null;

export function loadTreeExpansion(): ReadonlySet<string> | null {
  return stored;
}

export function saveTreeExpansion(keys: ReadonlySet<string>): void {
  stored = new Set(keys);
}

export function __resetTreeExpansionForTests(): void {
  stored = null;
}
```

- [ ] **Step 2: 失敗するテストを書く** (`tests/components/BlogTagTreeSidebar.test.tsx`)

```tsx
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BlogTagTreeSidebar } from "@/components/blog/BlogTagTreeSidebar.tsx";
import { buildBlogTagTree } from "@/lib/blog/tree.ts";
import { __resetTreeExpansionForTests } from "@/lib/blog/treeExpansion.ts";

const tree = buildBlogTagTree([
  { slug: "2025-12-11 0930", tags: ["UI-UX", "マイクロコピー", "ライティング"] },
  { slug: "2025-02-14 0930", tags: ["映画", "スターウォーズ"] },
]);

beforeEach(() => {
  __resetTreeExpansionForTests();
});

describe("BlogTagTreeSidebar", () => {
  it("トップレベルのタグをコードポイント昇順で表示する", () => {
    render(<BlogTagTreeSidebar tree={tree} currentTagset={null} />);
    const labels = screen.getAllByRole("row").map((r) => r.textContent);
    expect(labels[0]).toContain("UI-UX");
  });

  it("現在ページの集合と一致するすべてのノードをアクティブ表示する", () => {
    render(<BlogTagTreeSidebar tree={tree} currentTagset="スターウォーズ+映画" />);
    // 「映画 > スターウォーズ」「スターウォーズ > 映画」の双方の末端が一致集合
    const current = screen.getAllByRole("row").filter((r) => r.getAttribute("aria-current") === "page");
    expect(current.length).toBeGreaterThanOrEqual(1); // 既定展開は正規チェーンのみなので可視は 1 つ以上
  });

  it("ノードのリンクは正規形 URL を指す", () => {
    render(<BlogTagTreeSidebar tree={tree} currentTagset="映画" />);
    const links = screen.getAllByRole("link").map((l) => l.getAttribute("href"));
    expect(links).toContain("/blog/tags/映画");
  });
});
```

注意: react-aria-components の `Tree` が jsdom でどの role を出すかは既存 `tests/components/TreeSidebar.test.tsx` のクエリ方法 (row / treeitem) に合わせて調整する。

- [ ] **Step 3: テストが失敗することを確認**

Run: `npx vitest run tests/components/BlogTagTreeSidebar.test.tsx`
Expected: FAIL

- [ ] **Step 4: BlogTagTreeSidebar を実装**

`src/components/layout/TreeSidebar.tsx` と `src/components/tree/ContentTree.tsx` を下敷きに実装する。骨子:

```tsx
import { useMemo, useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button, Tree, TreeItem, TreeItemContent, Collection, type Key } from "react-aria-components";
import { TreeSearch } from "@/components/tree/TreeSearch.tsx";
import { canonicalChainIds, filterBlogTree, type BlogTreeNode } from "@/lib/blog/tree.ts";
import { decodeTagset } from "@/lib/blog/tagset.ts";
import { loadTreeExpansion, saveTreeExpansion } from "@/lib/blog/treeExpansion.ts";

interface BlogTagTreeSidebarProps {
  tree: readonly BlogTreeNode[];
  /** 現在ページの正規 tagset。トップ (/blog) は null */
  currentTagset: string | null;
}

export function BlogTagTreeSidebar({ tree, currentTagset }: BlogTagTreeSidebarProps) {
  const [query, setQuery] = useState("");

  // コールド読み込み時のみ正規チェーンを既定展開。以後はユーザー操作を保持
  const [expandedKeys, setExpandedKeys] = useState<Set<Key>>(() => {
    const restored = loadTreeExpansion();
    if (restored) return new Set(restored as Set<Key>);
    if (currentTagset === null) return new Set();
    return new Set(canonicalChainIds(tree, decodeTagset(currentTagset)));
  });

  const handleExpandedChange = (keys: Set<Key>) => {
    setExpandedKeys(keys);
    saveTreeExpansion(new Set([...keys].map(String)));
  };

  const { tree: visibleTree, matchedIds } = useMemo(() => filterBlogTree(tree, query), [tree, query]);
  // フィルタ中は一致ノードの祖先を自動展開 (ユーザー保存分と合成)
  const effectiveExpanded = useMemo(
    () => (query.trim() === "" ? expandedKeys : new Set<Key>([...expandedKeys, ...matchedIds])),
    [expandedKeys, matchedIds, query],
  );

  return (
    <div>
      <TreeSearch value={query} onChange={setQuery} placeholder="Filter tags" ariaLabel="Filter blog tags" />
      <Tree
        aria-label="Blog tags"
        items={visibleTree}
        expandedKeys={effectiveExpanded}
        onExpandedChange={handleExpandedChange}
        selectionMode="none"
      >
        {function renderNode(node: BlogTreeNode) {
          const isActive = node.tagset === currentTagset;
          return (
            <TreeItem
              id={node.id}
              textValue={node.label}
              href={`/blog/tags/${node.tagset}`}
              aria-current={isActive ? "page" : undefined}
            >
              <TreeItemContent>
                {/* chevron (開閉) はリンクと独立したボタン。ContentTree の FolderItem を踏襲 */}
                {node.children.length > 0 && <Button slot="chevron">▸</Button>}
                {node.label}
              </TreeItemContent>
              <Collection items={node.children}>{renderNode}</Collection>
            </TreeItem>
          );
        }}
      </Tree>
    </div>
  );
}
```

実装時の必須調整 (骨子からの具体化):
- styles は `ContentTree.tsx` の `styles.item(level)` / `rowSelected` / `rowFocused` と同じトークン (`space.s3` / `colors.selectedBg` 等) で揃える。`level` は `TreeItemContent` の renderProps から取得
- `TreeItem` の `href` + 内部 chevron `Button` の組み合わせが RAC で成立するかを確認する。RAC の `TreeItem` は `href` を渡すと行全体がリンクになるため、chevron `Button` (slot="chevron") のクリックがナビゲーションを起こさないことを dev サーバーで実際に確認する。うまく分離できない場合の代替: ラベル部分だけを `<Link>` にし、`TreeItem` 自体は非リンクにする (既存 `NoteItem` が href 方式なので、まず href 方式を試す)
- アクティブ表示は `aria-current="page"` + `rowSelected` 相当のスタイル。**一致する全ノード**に付与される (順列の双子ノード含む) ことをテストで確認
- 空ツリー時は既存 TreeSidebar 同様の empty メッセージ (`No tags`) を表示

- [ ] **Step 5: ルートに差し込み**

Task 9 の 4 ルート (`blog/index.tsx`、`blog/page/$n.tsx`、`blog/tags/$tagset/index.tsx`、`blog/tags/$tagset/page/$n.tsx`) の `AppShell` に `treeSidebar={<BlogTagTreeSidebar tree={tree} currentTagset={…} />}` を設定。`currentTagset` はトップ系 = `null`、タグ詳細系 = `data.tagset`。`useMemo` で安定参照化 (既存ルートの `treeSidebar` パターン踏襲)。

- [ ] **Step 6: テスト + dev 確認**

Run: `npx vitest run tests/components/BlogTagTreeSidebar.test.tsx`
Expected: PASS

Run: `npm run typecheck && npm run lint && npm run test`
Expected: グリーン

Run: `VAULT_ROOT=$PWD/tests/fixtures/vault npm run dev` で確認:
- `/blog` でツリーに `UI-UX / スターウォーズ / デザインシステム / マイクロコピー / ライティング / 映画` 相当のトップレベル (fixtures のタグ構成に応じた並び)
- ツリーのノードクリックで正規 URL へ遷移し、遷移後もクリック元の枝が開いたまま
- `/blog/tags/UI-UX--デザインシステム` を直接リロード → `UI-UX` の枝だけが既定展開される

- [ ] **Step 7: コミット**

```bash
git add -A
git commit -m "feat(blog): タグ共起ツリーのサイドバーを追加"
```

---

### Task 11: グローバル統合 — ナビ・トップページ

**Files:**
- Modify: `src/components/common/Icon.tsx` (`blogBold` を追加。実 bold 素材が未支給のため当面 `BLOG_MASK` と同じ data URI を流用し、TODO コメントを残す)
- Modify: `src/components/layout/navSections.tsx` (`NavSection.to` union に `"/blog"`、`NAV_SECTIONS` に Blog エントリ)
- Modify: `src/server/home.ts` / `src/server/projectHomePage.ts` (`HomeCounts.blog`、最近更新に Blog を横断)
- Modify: `src/components/home/ContentTypeEntries.tsx` (`ENTRIES` に Blog 入口カード)
- Modify: `src/components/home/ContentLink.tsx` (blog 分岐: 全ファセット集合ページ + アンカーへ)
- Test: `tests/server/home.test.ts` (既存に追記)

**Interfaces:**
- Consumes: `getBlogModel` / `locateArticle` (Task 8)、`blogArticleTitle`
- Produces:
  - `HomeCounts` に `blog: number`
  - `HomeRecentItem` に blog 用のリンク情報。既存が `{ type, slug, title, updated }` 形なら、blog のときだけ使う optional フィールド `blogLink?: { tagset: string; page: number; anchorId: string }` を追加する (discriminated union への全面改修はしない)

- [ ] **Step 1: 失敗するテストを追記** (`tests/server/home.test.ts`)

```typescript
it("最近更新に Blog 記事が updated 降順で混ざる", async () => {
  const data = await projectHomePage(); // 既存テストの呼び出し方に合わせる
  const blogItem = data.recent.find((r) => r.type === "blog");
  expect(blogItem).toBeDefined();
  expect(blogItem!.title).toBe("#UI-UX#マイクロコピー#ライティング"); // updated 最新の Blog fixture
  expect(blogItem!.blogLink).toEqual({
    tagset: "UI-UX+マイクロコピー+ライティング",
    page: 1,
    anchorId: "p-2025-12-11-0930",
  });
});

it("コンテンツ入口の件数に blog が入る", async () => {
  const data = await projectHomePage();
  expect(data.counts.blog).toBe(5); // published のみ
});
```

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/server/home.test.ts`
Expected: 追記分が FAIL

- [ ] **Step 3: サーバ側を実装**

`src/server/projectHomePage.ts`:
- `HomeCounts` に `blog: number` を追加し、`dataset.blog.length` を数える
- 最近更新の横断ソート対象に Blog を追加。Blog は `updated` が必須なので全件が候補。`title` は `RenderedBlogArticle.title` (= タグ併記)。`blogLink` は `getBlogModel()` の `locateArticle(model.pages, article.canonicalTagset, slug)` + `anchorId` から作る (`projectHomePage` が dataset 直参照で組んでいる場合は、blog の canonicalTagset / anchorId / ページ番号算出のために `getBlogModel()` を併用する)
- `RECENT_LIMIT = 5` は据え置き

- [ ] **Step 4: UI 側を実装**

- `src/components/home/ContentLink.tsx` — `type === "blog"` の分岐を追加。`blogLink` を受け取り、`page > 1` なら `/blog/tags/$tagset/page/$n`、それ以外は `/blog/tags/$tagset`、`hash={anchorId}` (Task 9 の `BlogArticleBlock` のリンク分岐と同じ形)
- `src/components/home/ContentTypeEntries.tsx` — `ENTRIES` に `{ type: "blog", to: "/blog", … }` を追加 (件数は `counts.blog`)
- `src/components/common/Icon.tsx` — `IconType` に `"blogBold"`、`BLOG_BOLD_MASK` (当面 `BLOG_MASK` と同値。`// TODO: bold 素材が用意でき次第差し替える`)、`TYPE_STYLES` にエントリ追加。**data URI は同一ファイル内のフラット const にする** (ファイル冒頭コメントの制約)
- `src/components/layout/navSections.tsx` — `to` union に `"/blog"` を追加し、`NAV_SECTIONS` の Books の後に:

```typescript
{
  to: "/blog",
  label: "Blog",
  icon: "blog",
  iconActive: "blogBold",
  isActive: sectionActive("/blog"),
},
```

(IconNav と MobileBottomNav は `NAV_SECTIONS` を共有しているため両方に反映される)

- [ ] **Step 5: テスト + 検証**

Run: `npm run typecheck && npm run lint && npm run test`
Expected: グリーン

Run: `VAULT_ROOT=$PWD/tests/fixtures/vault npm run dev` — トップページに Blog 入口カードと最近更新の Blog 行、IconNav に Blog アイコンが出ることを確認。最近更新の Blog 行クリックで該当記事アンカーへ着地することを確認

- [ ] **Step 6: コミット**

```bash
git add -A
git commit -m "feat(blog): ナビとトップページへ Blog を統合"
```

---

### Task 12: feed / sitemap / post-build

**Files:**
- Modify: `src/lib/feed/atom.ts` (`FeedEntry` に `published?: string`、`renderAtomXml` で `<published>` を出力)
- Create: `src/lib/feed/blogFeed.ts` (Blog 専用エントリ構築)
- Modify: `src/lib/feed/sitemap.ts` (`SitemapInput.blogPages`)
- Modify: `scripts/post-build.ts` (`/blog/feed.xml` 出力 + sitemap への Blog ページ列挙)
- Modify: `src/lib/feed/index.ts` (re-export)
- Test: `tests/lib/feed/blogFeed.test.ts`、`tests/lib/feed/sitemap.test.ts` (追記)

**Interfaces:**
- Consumes: `BlogModel` (Task 8)、`extractFeedSummary` / `stripHtmlTags` / `joinSiteUrl` / `renderAtomXml` (既存)
- Produces:
  - `buildBlogFeedEntries(model: BlogModel, siteUrl: string, maxItems: number): FeedEntry[]` — 作成日時降順、`title` = タグ併記、`href` = 全ファセット集合ページ (+ `/page/n`) + アンカー、`published` = createdIso、`updated` = frontmatter.updated、`summary` = 本文抜粋
  - `buildBlogSitemapPages(model: BlogModel): { path: string; lastmod?: string }[]` — `/blog`、`/blog/page/[n]`、全 tagset ページ + そのページネーション。`lastmod` = そのページ掲載記事の `updated` 最大値

- [ ] **Step 1: 失敗するテストを書く** (`tests/lib/feed/blogFeed.test.ts`)

```typescript
import { describe, expect, it } from "vitest";
import { buildBlogFeedEntries, buildBlogSitemapPages } from "@/lib/feed/index.ts";
import { enumerateFacetPages } from "@/lib/blog/pages.ts";
import { buildBlogTagTree } from "@/lib/blog/tree.ts";
import { articleFacets, blogArticleTitle, canonicalFullFacetSet, encodeTagset } from "@/lib/blog/tagset.ts";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";
import type { BlogArticleModel, BlogModel } from "@/server/blog.ts";

const SITE = "https://example.com";

interface Def {
  slug: string;
  tags: string[];
  updated: string;
}

// server キャッシュに依存せず、純関数の組み合わせで BlogModel を手組みする
function makeModel(defs: readonly Def[]): BlogModel {
  const articles: BlogArticleModel[] = defs
    .map((d) => {
      const date = parseBlogSlugDate(d.slug, "+09:00")!;
      return {
        slug: d.slug,
        anchorId: date.anchorId,
        displayDate: date.displayDate,
        createdIso: date.createdIso,
        updated: d.updated,
        tokens: d.tags,
        facetSet: new Set(articleFacets(d.tags)),
        canonicalTagset: encodeTagset(canonicalFullFacetSet(d.tags)),
        title: blogArticleTitle(d.tags),
        html: "<p>本文テキスト</p>",
        footnotes: [],
      };
    })
    .sort((a, b) => (a.slug < b.slug ? 1 : -1));
  const inputs = articles.map((a) => ({ slug: a.slug, tags: a.tokens }));
  return {
    articles,
    bySlug: new Map(articles.map((a) => [a.slug, a])),
    pages: enumerateFacetPages(inputs),
    tree: buildBlogTagTree(inputs),
  };
}

const twoArticles: Def[] = [
  { slug: "2025-12-11 0930", tags: ["UI-UX", "マイクロコピー"], updated: "2025-12-20T10:00:00+09:00" },
  { slug: "2025-02-14 0930", tags: ["映画"], updated: "2025-02-14T09:30:00+09:00" },
];

describe("buildBlogFeedEntries", () => {
  it("作成日時降順・タグ併記タイトル・正規ページ + アンカーの link を生成する", () => {
    const entries = buildBlogFeedEntries(makeModel(twoArticles), SITE, 20);
    expect(entries).toHaveLength(2);
    expect(entries[0]!.title).toBe("#UI-UX#マイクロコピー");
    expect(entries[0]!.href).toBe(
      `${SITE}/blog/tags/${encodeURIComponent("UI-UX+マイクロコピー")}#p-2025-12-11-0930`,
    );
    expect(entries[0]!.published).toBe("2025-12-11T09:30:00+09:00");
    expect(entries[0]!.updated).toBe("2025-12-20T10:00:00+09:00");
  });

  it("maxItems で切り詰める", () => {
    expect(buildBlogFeedEntries(makeModel(twoArticles), SITE, 1)).toHaveLength(1);
  });
});

describe("buildBlogSitemapPages", () => {
  it("/blog と全 tagset ページを列挙し、lastmod は掲載記事の updated 最大値", () => {
    const pages = buildBlogSitemapPages(makeModel(twoArticles));
    const paths = pages.map((p) => p.path);
    expect(paths).toContain("/blog");
    expect(paths).toContain("/blog/tags/映画");
    expect(pages.find((p) => p.path === "/blog")!.lastmod).toBe("2025-12-20T10:00:00+09:00");
  });

  it("11 件以上の集合にはページネーション URL を含める (/page/1 は含めない)", () => {
    const many: Def[] = Array.from({ length: 12 }, (_, i) => ({
      slug: `2025-01-${String(i + 1).padStart(2, "0")} 0900`,
      tags: ["映画"],
      updated: "2025-02-01T00:00:00+09:00",
    }));
    const paths = buildBlogSitemapPages(makeModel(many)).map((p) => p.path);
    expect(paths).toContain("/blog/page/2");
    expect(paths).toContain("/blog/tags/映画/page/2");
    expect(paths).not.toContain("/blog/page/1");
  });
});
```

注意: feed の href が percent-encode されるか (`joinSiteUrl` の挙動) は既存 sitemap の日本語 slug 出力に合わせる。期待値の `encodeURIComponent` 有無は既存 `tests/lib/feed/url.test.ts` の仕様に揃えること (`+` はエンコードすると `%2B` になり別 URL になるため、`joinSiteUrl` が `+` を素通しすることを確認し、必要ならセグメントエンコードの除外文字に加える)。

- [ ] **Step 2: テストが失敗することを確認**

Run: `npx vitest run tests/lib/feed/blogFeed.test.ts`
Expected: FAIL

- [ ] **Step 3: 実装**

`src/lib/feed/atom.ts`:
- `FeedEntry` に `published?: string;` を追加
- `renderAtomXml` のエントリ出力に `published` があるときのみ `<published>…</published>` を追加 (既存の `<updated>` の並び)

`src/lib/feed/blogFeed.ts`:

```typescript
import type { BlogModel } from "@/server/blog.ts";
import { locateArticle } from "@/lib/blog/pages.ts";
import { stripHtmlTags } from "./summary.ts"; // 既存の抜粋ロジックを流用 (関数名は summary.ts の実 export に合わせる)
import { joinSiteUrl } from "./url.ts";
import type { FeedEntry } from "./atom.ts";

// Blog 専用 Atom フィード (docs/blog-spec.md「フィード」)。
// エントリの link は「記事の全ファセット集合ページ (正規形) + 記事アンカー」。
// 対象記事が 2 ページ目以降にある場合も正しい /page/[n] を指す。
export function buildBlogFeedEntries(model: BlogModel, siteUrl: string, maxItems: number): FeedEntry[] {
  return model.articles.slice(0, maxItems).map((article) => {
    const located = locateArticle(model.pages, article.canonicalTagset, article.slug)!;
    const path =
      located.page > 1
        ? `/blog/tags/${article.canonicalTagset}/page/${located.page}`
        : `/blog/tags/${article.canonicalTagset}`;
    const href = `${joinSiteUrl(siteUrl, path)}#${article.anchorId}`;
    return {
      id: href,
      title: article.title,
      updated: article.updated,
      published: article.createdIso,
      href,
      summary: extractSummaryFromHtml(article.html),
    };
  });
}
```

`extractSummaryFromHtml` は既存 `extractFeedSummary` が `RenderedItem` を受ける形なら、html 文字列を受ける小関数を `summary.ts` に切り出して両者で共用する (二重実装しない)。

`buildBlogSitemapPages` も同ファイルに実装:

```typescript
export interface BlogSitemapPage {
  path: string;
  lastmod?: string;
}

export function buildBlogSitemapPages(model: BlogModel): BlogSitemapPage[] {
  const pages: BlogSitemapPage[] = [];
  const lastmodOf = (slugs: readonly string[]): string | undefined => {
    const updates = slugs.map((s) => model.bySlug.get(s)!.updated).sort();
    return updates.at(-1);
  };

  const pushPaginated = (basePath: string, slugs: readonly string[]) => {
    const total = Math.max(1, Math.ceil(slugs.length / 10));
    const lastmod = lastmodOf(slugs);
    pages.push(lastmod ? { path: basePath, lastmod } : { path: basePath });
    for (let n = 2; n <= total; n++) {
      pages.push(lastmod ? { path: `${basePath}/page/${n}`, lastmod } : { path: `${basePath}/page/${n}` });
    }
  };

  pushPaginated("/blog", model.articles.map((a) => a.slug));
  for (const page of model.pages.values()) {
    pushPaginated(`/blog/tags/${page.tagset}`, page.slugs);
  }
  return pages;
}
```

(`10` は `BLOG_PAGE_SIZE` を import して使う。ハードコードしない)

`src/lib/feed/sitemap.ts`:
- `SitemapInput` に `blogPages: readonly BlogSitemapPage[];` を追加
- `buildSitemapEntries` で固定 URL 群に続けて `blogPages` を push (`joinSiteUrl` でエンコード。既存 `pushType` の URL 組み立てに合わせる)

`scripts/post-build.ts`:
- `getBlogModel()` を import して取得
- `writeSitemap` の入力に `blogPages: buildBlogSitemapPages(model)` を追加
- `writeBlogFeed()` を新設: `buildBlogFeedEntries(model, SITE_URL, config.content.blog.feedMaxItems)` → `renderAtomXml` (self href = `${SITE_URL}/blog/feed.xml`) → `dist/client/blog/feed.xml` に書き出し。`writeSitemap` / `writeFeed` と同じ並びで `Promise.all` に加える

- [ ] **Step 4: テスト + 全体検証**

Run: `npx vitest run tests/lib/feed/`
Expected: PASS (既存 atom / sitemap テストの回帰なし)

Run: `npm run typecheck && npm run lint && npm run test`
Expected: グリーン

- [ ] **Step 5: コミット**

```bash
git add -A
git commit -m "feat(blog): Blog 専用フィードと sitemap 統合を追加"
```

---

### Task 13: E2E ビルド検証と実装ログ更新

**Files:**
- Modify: `docs/implementation-log.md` (Phase 9-(x) として Blog 実装のログを追記)
- Modify: `CLAUDE.md` (「コンテンツタイプ」節に Blog を追記、実装状況の更新)

- [ ] **Step 1: fixtures でフルビルド**

```bash
VAULT_ROOT=$PWD/tests/fixtures/vault npm run build
```

Expected: `crawlLinks` + `failOnError: true` で成功。確認項目:

```bash
ls dist/client/blog/                      # index.html + tags/ + feed.xml
ls "dist/client/blog/tags/"               # 正規形 tagset のディレクトリ群 (エンコード済み日本語)
grep -l "data-pagefind-body" dist/client/blog/tags/*/index.html | head  # 正規ページのみに付与
cat dist/client/sitemap.xml | grep "/blog" | head -20
cat dist/client/blog/feed.xml | head -30  # <published> と #p- アンカー入り link
```

- 生成された `/blog/tags/` 配下のページ集合が `enumerateFacetPages` の期待と一致すること (ツリーからの crawlLinks 到達で全正規ページが出る)
- 非正規 URL (`映画+スターウォーズ` 等) のディレクトリが**生成されていない**こと
- Pagefind のインデックス (`dist/client/pagefind/`) が生成され、blog 記事の本文語が検索できること (`npx pagefind --site dist/client` のログで確認)

- [ ] **Step 2: preview で表示確認**

```bash
VAULT_ROOT=$PWD/tests/fixtures/vault npm run preview
```

- `/blog` → 記事ブロック 5 件、区切り線、ページタイトルなし、パンくず `Blog`
- `/blog/tags/UI-UX` → 4 件 (階層タグ記事を含む)、`2025-10-29` の記事に `#デザインシステム` 併記、クリックで `/blog/tags/UI-UX--デザインシステム#p-2025-10-29-1400` へ
- `/blog/tags/スターウォーズ+映画` → 1 件、パンくず `Blog › #スターウォーズ › #スターウォーズ#映画`
- 脚注付き記事 (2025-02-14) の Marginalia が広い画面で右ガターに float し、狭い画面 (≤1023px) で記事末尾の FootnoteSection に出る
- ダークモード切替・キーボードでのツリー操作 (`Tab` / 矢印 / `Enter`) を確認

dev / preview の**両方**で確認する (実装ログ「ツールチェーン追従メモ」: dev 経路のみで顕在化する不具合があるため)。

- [ ] **Step 3: 実 Vault でのビルド確認 (任意、Vault が手元にある場合)**

```bash
npm run build && npm run deploy:dry
```

実 Vault に `Blog/` が未整備の場合、記事 0 件でも `/blog` が空状態で正常に出ること (ツリー空メッセージ、記事なし表示) を確認する。

- [ ] **Step 4: 実装ログと CLAUDE.md を更新**

`docs/implementation-log.md` に「Phase 9-(5) (Blog コンテンツタイプ)」節を追記 (既存フォーマット: 達成範囲 / 公開 API / 主要ファイル / 設計判断 / 検証)。設計判断には最低限以下を残す:
- id 名前空間 (clobberPrefix + rehypePrefixIds + applyFootnote idPrefix の 3 点セット) の理由
- Blog をリンク index / backlinks から除外した箇所
- ツリー展開のモジュールストア方式
- `pathParamsAllowedCharacters: ["+"]`
- lock-step (生成ページ = ツリーノード集合) をテストで担保していること

`CLAUDE.md`:
- 「現在の実装状況」に Blog 実装完了を追記
- 「コンテンツタイプ」に `**Blog** — Blog/ 配下、フラット、ファイル名は作成日時 (YYYY-MM-DD HHmm)` を追記
- 「URL 構造」「タグ」に blog-spec への参照を一行追記

- [ ] **Step 5: コミット**

```bash
git add docs/implementation-log.md CLAUDE.md
git commit -m "docs: Blog 実装の完了を実装ログと CLAUDE.md に反映"
```

---

## Self-Review 結果 (計画作成時に実施済み)

- **仕様カバレッジ**: blog-spec の全セクションをタスクへ対応付けた — ソースとデータモデル (Task 3/4)、タグ正規形 (Task 2)、URL 構造・絞り込み・単一ページ生成 (Task 5/8/9)、sitemap / 検索 (Task 12 / 9)、左サイドツリー (Task 6/10)、ページ仕様・アンカー・リンク遷移・ページネーション (Task 5/8/9)、レイアウトと Marginalia (Task 7/9)、Markdown 拡張 (Task 7)、リンクグラフ外向きのみ (Task 7/8)、グローバル統合 (Task 11/12)、設定ファイル (Task 4)
- **既知の残リスク** (実装時に確認):
  1. RAC `TreeItem` の `href` + chevron `Button` の共存 (Task 10 Step 4 に代替案を明記)
  2. TanStack Router の `pathParamsAllowedCharacters` が `Link` の `params` 出力に効くこと (Task 9 Step 10 の dev 確認でカバー)
  3. prerender クローラがアンカー付き URL (`…#p-…`) を fragment 除去して扱うこと (Task 13 Step 1 のフルビルドでカバー)
  4. `tests/server/blog.test.ts` のキャッシュフック名 (`__setSiteDatasetConfigForTests` 等) は datasets.ts の実 export に合わせる

## 実行方法

Two execution options:

1. **Subagent-Driven (recommended)** — superpowers:subagent-driven-development でタスクごとに fresh subagent を dispatch し、間でレビュー
2. **Inline Execution** — superpowers:executing-plans で本セッション内をバッチ実行 + チェックポイント
