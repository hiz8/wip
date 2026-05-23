import type { Element, ElementContent, Root, RootContent } from "hast";

// Wrap each h2 with <section data-heading-id="…"> and, inside each h2 section,
// wrap each h3 with a nested <section data-heading-id="…">. The id is copied
// from the heading's own `id` property so the TOC anchor can match the section
// via `[data-heading-id]`. The heading element itself keeps its own `id` so
// existing `#hash` anchors continue to work.
export function rehypeSectionize() {
  return (tree: Root): void => {
    // remarkRehype output never contains <doctype>, so it is safe to treat
    // tree.children as ElementContent[] for sectionizing.
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
