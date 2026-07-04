import type { FootnoteDefinition, Parent, Root, RootContent } from "mdast";
import { visitParents } from "unist-util-visit-parents";
import type { FootnoteEntry } from "@/types/content.ts";

export interface FootnoteContext {
  footnotes: FootnoteEntry[];
  renderHtml: (subtree: Root) => Promise<string>;
  /** 複数記事を同一ページに載せる Blog 用の id 名前空間。省略時は remark-rehype 既定と同じ */
  idPrefix?: string;
}

interface PendingAside {
  container: Parent;
  paragraphIndex: number;
  html: string;
}

export async function applyFootnote(tree: Root, ctx: FootnoteContext): Promise<void> {
  const definitions: FootnoteDefinition[] = [];
  const remaining: RootContent[] = [];

  for (const node of tree.children) {
    if (node.type === "footnoteDefinition") {
      definitions.push(node);
    } else {
      remaining.push(node);
    }
  }
  tree.children = remaining;

  const htmlByIdentifier = new Map<string, string>();
  let counter = 0;
  for (const def of definitions) {
    counter += 1;
    const subtree: Root = { type: "root", children: [...def.children] };
    const html = await ctx.renderHtml(subtree);
    htmlByIdentifier.set(def.identifier, html);
    ctx.footnotes.push({
      id: def.identifier,
      label: def.label ?? String(counter),
      html,
    });
  }

  // 各 footnoteReference の隣に block レベルの <aside> 挿入を収集する。
  // aside は参照を含む段落の (内側にネストするのではなく) 兄弟として置くため、
  // 複数段落や block コンテンツの脚注本文も安全にレンダリングできる。<p> 内の
  // inline span の内側に block 要素を置くと HTML5 の auto-close が発動し、
  // float を壊してしまう。
  //
  // CSS は狭い viewport で aside を隠し、そこでは末尾の FootnoteSection が
  // 引き継ぐ。
  const pending: PendingAside[] = [];
  let ordinal = 0;
  const asidePrefix = ctx.idPrefix ?? "user-content-";
  visitParents(tree, "footnoteReference", (node, ancestors) => {
    const html = htmlByIdentifier.get(node.identifier);
    if (html === undefined) return;

    const location = findParagraphLocation(ancestors);
    if (!location) return;

    ordinal += 1;
    const side = readSide(node);
    const sideAttr = side ? ` data-side="${side}"` : "";
    const asideHtml = `<aside class="footnote-aside" id="${asidePrefix}fn-aside-${ordinal}"${sideAttr} role="note">${html}</aside>`;
    pending.push({
      container: location.container,
      paragraphIndex: location.index,
      html: asideHtml,
    });
  });

  // ドキュメント順の逆向きに splice することで、先に行う挿入が後続のために
  // 捕捉したインデックスをずらさないようにする。
  for (let i = pending.length - 1; i >= 0; i--) {
    const entry = pending[i];
    if (!entry) continue;
    const asideNode: RootContent = { type: "html", value: entry.html };
    entry.container.children.splice(entry.paragraphIndex + 1, 0, asideNode);
  }
}

// footnoteReference の最も近い段落の祖先と、それを保持するコンテナを探す。
// コンテナとなる親と、そのコンテナ内での段落のインデックスを返すことで、呼び出し
// 元がその後ろに兄弟を挿入できるようにする。
function findParagraphLocation(
  ancestors: readonly Parent[],
): { container: Parent; index: number } | null {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const node = ancestors[i];
    if (!node || node.type !== "paragraph") continue;
    const container = ancestors[i - 1];
    if (!container) return null;
    const idx = container.children.indexOf(node as RootContent);
    if (idx === -1) return null;
    return { container, index: idx };
  }
  return null;
}

interface NodeWithData {
  data?: { hProperties?: Record<string, unknown> | undefined } | undefined;
}

function readSide(node: NodeWithData): "left" | "right" | undefined {
  const v = node.data?.hProperties?.["data-side"];
  return v === "left" || v === "right" ? v : undefined;
}
