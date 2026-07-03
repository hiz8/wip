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
    // 階層 (U < デ) / 共起の順
    expect(uiux.children[0]!.tagset).toBe("UI-UX--デザインシステム");
    expect(uiux.children[1]!.tagset).toBe("UI-UX+デザインシステム");
    expect(uiux.children[0]!.id).not.toBe(uiux.children[1]!.id);
  });
});

describe("canonicalChainIds", () => {
  it("正規チェーン上のノード id を先頭から返す", () => {
    const tree = buildBlogTagTree(imageA);
    const ids = canonicalChainIds(tree, ["UI-UX", "マイクロコピー", "ライティング"]);
    expect(ids).toEqual(["UI-UX", "UI-UX|マイクロコピー", "UI-UX|マイクロコピー|ライティング"]);
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
    // トップ一致 / 子孫一致での温存を両方確認する
    expect(labels(filtered)).toContain("ライティング");
    expect(labels(filtered)).toContain("UI-UX");
    expect(matchedIds.length).toBeGreaterThan(0);
  });

  it("空クエリは全ツリーを返す", () => {
    const tree = buildBlogTagTree(imageA);
    expect(filterBlogTree(tree, "").tree).toEqual([...tree]);
  });
});
