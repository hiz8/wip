import type { Blockquote, Paragraph, Root, RootContent, Text } from "mdast";
import type { CalloutEntry, CalloutKind } from "@/types/content.ts";

const CALLOUT_HEAD_RE = /^\[!(\w+)\](-|\+)?\s*(.*)$/;

const SUPPORTED: ReadonlySet<CalloutKind> = new Set(["note", "quote", "tip", "info", "warning"]);

export interface CalloutContext {
  callouts: CalloutEntry[];
  renderHtml: (subtree: Root) => Promise<string>;
}

export interface CalloutPass {
  detect: (tree: Root) => DetectedCallout[];
}

export interface DetectedCallout {
  index: number;
  kind: CalloutKind;
  title: string | undefined;
  isPrivate: boolean;
  blockquote: Blockquote;
}

export function detectCallouts(tree: Root): DetectedCallout[] {
  const found: DetectedCallout[] = [];
  for (let i = 0; i < tree.children.length; i++) {
    const node = tree.children[i];
    if (!node || node.type !== "blockquote") continue;
    const head = parseCalloutHeader(node);
    if (!head) continue;
    found.push({
      index: i,
      kind: head.kind,
      title: head.title,
      isPrivate: head.isPrivate,
      blockquote: node,
    });
  }
  return found;
}

export async function applyCallout(tree: Root, ctx: CalloutContext): Promise<void> {
  const detected = detectCallouts(tree);
  if (detected.length === 0) return;

  for (const item of detected) {
    if (item.isPrivate) continue;
    stripCalloutHeader(item.blockquote);
    annotateBlockquote(item.blockquote, item.kind, item.title);
    const id = `callout-${ctx.callouts.length + 1}`;
    item.blockquote.data = {
      ...item.blockquote.data,
      hProperties: {
        ...((item.blockquote.data?.hProperties ?? {}) as Record<string, unknown>),
        id,
      },
    };
    const subtree: Root = { type: "root", children: [...item.blockquote.children] };
    const html = await ctx.renderHtml(subtree);
    const entry: CalloutEntry = {
      id,
      kind: item.kind,
      title: item.title,
      html,
    };
    ctx.callouts.push(entry);
  }

  removePrivateCallouts(tree, detected);
}

function parseCalloutHeader(node: Blockquote): {
  kind: CalloutKind;
  title: string | undefined;
  isPrivate: boolean;
} | null {
  const first = node.children[0];
  if (!first || first.type !== "paragraph") return null;
  const firstChild = first.children[0];
  if (!firstChild || firstChild.type !== "text") return null;

  const value = (firstChild as Text).value;
  const lines = value.split("\n");
  const headerLine = lines[0] ?? "";
  const match = CALLOUT_HEAD_RE.exec(headerLine.trim());
  if (!match) return null;

  const rawKind = (match[1] ?? "").toLowerCase();
  const kind: CalloutKind = (
    SUPPORTED.has(rawKind as CalloutKind) ? rawKind : "note"
  ) as CalloutKind;
  const titleRaw = (match[3] ?? "").trim();
  const isPrivate = /\bprivate\b/i.test(titleRaw);
  const title = titleRaw.length > 0 ? titleRaw : undefined;

  return { kind, title, isPrivate };
}

function stripCalloutHeader(node: Blockquote): void {
  const first = node.children[0];
  if (!first || first.type !== "paragraph") return;
  const firstChild = first.children[0];
  if (!firstChild || firstChild.type !== "text") return;

  const text = firstChild as Text;
  const newline = text.value.indexOf("\n");
  if (newline === -1) {
    (first as Paragraph).children.shift();
    if ((first as Paragraph).children.length === 0) {
      node.children.shift();
    }
    return;
  }
  text.value = text.value.slice(newline + 1);
}

function annotateBlockquote(node: Blockquote, kind: CalloutKind, title: string | undefined): void {
  node.data = {
    ...node.data,
    hProperties: {
      ...((node.data?.hProperties ?? {}) as Record<string, unknown>),
      "data-callout": kind,
      ...(title ? { "data-callout-title": title } : {}),
    },
  };
}

function removePrivateCallouts(tree: Root, detected: DetectedCallout[]): void {
  const privateNodes = new Set<RootContent>(
    detected.filter((d) => d.isPrivate).map((d) => d.blockquote),
  );
  if (privateNodes.size === 0) return;
  tree.children = tree.children.filter((node) => !privateNodes.has(node));
}
