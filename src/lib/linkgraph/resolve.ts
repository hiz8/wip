import type {
  BaseFrontmatter,
  BooksFrontmatter,
  ContentItem,
  ContentType,
  GlossaryFrontmatter,
} from "@/types/content.ts";
import { BuildError } from "@/lib/content/errors.ts";

export interface ContentIndex {
  byName: Map<string, ContentItem<BaseFrontmatter>[]>;
  byTypeName: Map<string, ContentItem<BaseFrontmatter>>;
}

export interface ResolvedTarget {
  item: ContentItem<BaseFrontmatter>;
  type: ContentType;
}

export interface ResolveOptions {
  fromFilePath: string;
  rawTarget: string;
}

export function buildContentIndex(items: readonly ContentItem<BaseFrontmatter>[]): ContentIndex {
  const byName = new Map<string, ContentItem<BaseFrontmatter>[]>();
  const byTypeName = new Map<string, ContentItem<BaseFrontmatter>>();

  for (const item of items) {
    addByName(byName, item.slug, item);
    indexExtraNames(byName, item);
    const typeKey = `${item.type}/${item.slug.toLowerCase()}`;
    byTypeName.set(typeKey, item);
  }

  return { byName, byTypeName };
}

function indexExtraNames(
  byName: Map<string, ContentItem<BaseFrontmatter>[]>,
  item: ContentItem<BaseFrontmatter>,
): void {
  if (item.type === "glossary") {
    const fm = item.frontmatter as GlossaryFrontmatter;
    if (fm.term && fm.term.trim().length > 0) addByName(byName, fm.term, item);
    addAliases(byName, fm.aliases, item);
  } else if (item.type === "books") {
    const fm = item.frontmatter as BooksFrontmatter;
    addAliases(byName, fm.aliases, item);
  }
}

function addAliases(
  byName: Map<string, ContentItem<BaseFrontmatter>[]>,
  aliases: readonly string[] | undefined,
  item: ContentItem<BaseFrontmatter>,
): void {
  if (!aliases) return;
  for (const alias of aliases) {
    if (alias.trim().length > 0) addByName(byName, alias, item);
  }
}

function addByName(
  byName: Map<string, ContentItem<BaseFrontmatter>[]>,
  rawKey: string,
  item: ContentItem<BaseFrontmatter>,
): void {
  const key = rawKey.toLowerCase();
  const existing = byName.get(key);
  if (existing) {
    if (!existing.some((entry) => entry === item)) {
      existing.push(item);
    }
  } else {
    byName.set(key, [item]);
  }
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

  const list = candidates.map((c) => `${c.type}/${c.slug}`).join(", ");
  throw new BuildError({
    category: "link-resolution",
    filePath: options.fromFilePath,
    message:
      `Ambiguous wiki-link "${options.rawTarget}" matches multiple items: ${list}. ` +
      `Use an explicit type prefix like [[Notes/${target}]], [[Glossary/${target}]], or [[Books/${target}]].`,
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
