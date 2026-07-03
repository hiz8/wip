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

  return [...promotedRoots].toSorted(compareCodePoints).map((root) => ({
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
  for (const facet of facets) {
    const steps = facet.includes("/") ? [tagAncestors(facet)[0]!, facet] : [facet];
    for (const step of steps) {
      const next = nodes.find((n) => n.addedFacet === step);
      // フィルタ中などで枝が見つからなければそこまでを返す
      if (!next) return ids;
      ids.push(next.id);
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
