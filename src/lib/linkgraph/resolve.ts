import type { ContentItem, ContentType, NotesFrontmatter } from "@/types/content.ts";
import { BuildError } from "@/lib/content/errors.ts";

export interface ContentIndex {
  byName: Map<string, ContentItem<NotesFrontmatter>[]>;
  byTypeName: Map<string, ContentItem<NotesFrontmatter>>;
}

export interface ResolvedTarget {
  item: ContentItem<NotesFrontmatter>;
  type: ContentType;
}

export interface ResolveOptions {
  fromFilePath: string;
  rawTarget: string;
}

export function buildContentIndex(items: ContentItem<NotesFrontmatter>[]): ContentIndex {
  const byName = new Map<string, ContentItem<NotesFrontmatter>[]>();
  const byTypeName = new Map<string, ContentItem<NotesFrontmatter>>();

  for (const item of items) {
    const key = item.slug.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.push(item);
    } else {
      byName.set(key, [item]);
    }

    const typeKey = `${item.type}/${item.slug.toLowerCase()}`;
    byTypeName.set(typeKey, item);
  }

  return { byName, byTypeName };
}

export function resolveLinkTarget(
  index: ContentIndex,
  options: ResolveOptions,
): ResolvedTarget | null {
  const target = stripSection(options.rawTarget).trim();
  if (target.length === 0) return null;

  const typed = parseTypePrefix(target);
  if (typed) {
    const direct = index.byTypeName.get(`${typed.type}/${typed.name.toLowerCase()}`);
    if (direct) return { item: direct, type: typed.type };
    return null;
  }

  const candidates = index.byName.get(target.toLowerCase());
  if (!candidates || candidates.length === 0) return null;
  if (candidates.length === 1) {
    const item = candidates[0]!;
    return { item, type: item.type };
  }

  const list = candidates.map((c) => c.filePath).join(", ");
  throw new BuildError({
    category: "link-resolution",
    filePath: options.fromFilePath,
    message: `Ambiguous wiki-link "${options.rawTarget}" matches multiple files: ${list}. Use an explicit type prefix like [[Notes/${target}]].`,
  });
}

function stripSection(target: string): string {
  const hash = target.indexOf("#");
  return hash === -1 ? target : target.slice(0, hash);
}

const TYPE_PREFIXES: Record<string, ContentType> = {
  notes: "notes",
  glossary: "glossary",
  books: "books",
};

function parseTypePrefix(target: string): { type: ContentType; name: string } | null {
  const slash = target.indexOf("/");
  if (slash === -1) return null;
  const head = target.slice(0, slash).toLowerCase();
  const type = TYPE_PREFIXES[head];
  if (!type) return null;
  const name = target.slice(slash + 1);
  if (name.length === 0) return null;
  return { type, name };
}
