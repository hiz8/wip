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
