import type { Element, ElementContent, Root, RootContent } from "hast";

// 各 h2 を <section data-heading-id="…"> で包み、各 h2 section の内側では各 h3 を
// ネストした <section data-heading-id="…"> で包む。id は見出し自身の `id`
// プロパティからコピーされるため、TOC anchor は `[data-heading-id]` 経由で
// section に一致できる。見出し要素自体は自前の `id` を保持するため、既存の
// `#hash` anchor も引き続き機能する。
export function rehypeSectionize() {
  return (tree: Root): void => {
    // remarkRehype の出力に <doctype> が含まれることはないため、sectionize の
    // 用途では tree.children を ElementContent[] として扱って安全。
    tree.children = sectionizeAtLevel(tree.children as ElementContent[], "h2") as RootContent[];
  };
}

function sectionizeAtLevel(nodes: ElementContent[], level: "h2" | "h3"): ElementContent[] {
  const innerLevel: "h3" | null = level === "h2" ? "h3" : null;
  const result: ElementContent[] = [];
  let bucket: ElementContent[] | null = null;
  let bucketId: string | null = null;

  const flush = () => {
    if (bucket && bucketId !== null) {
      const inner = innerLevel ? sectionizeAtLevel(bucket, innerLevel) : bucket;
      result.push(makeSection(bucketId, inner));
    } else if (bucket) {
      result.push(...bucket);
    }
    bucket = null;
    bucketId = null;
  };

  for (const node of nodes) {
    const id = headingIdOfLevel(node, level);
    if (id !== null) {
      flush();
      bucket = [node];
      bucketId = id;
      continue;
    }
    if (bucket) {
      bucket.push(node);
    } else {
      result.push(node);
    }
  }
  flush();
  return result;
}

function headingIdOfLevel(node: ElementContent, level: "h2" | "h3"): string | null {
  if (node.type !== "element" || node.tagName !== level) return null;
  const id = (node as Element).properties?.["id"];
  return typeof id === "string" && id.length > 0 ? id : null;
}

function makeSection(id: string, children: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "section",
    properties: { dataHeadingId: id },
    children,
  };
}
