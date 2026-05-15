import type { RenderedItem } from "@/types/content.ts";

const TAG_RE = /<[^>]+>/gu;
const WHITESPACE_RE = /\s+/gu;

export const DEFAULT_SUMMARY_LENGTH = 200;

export function stripHtmlTags(html: string): string {
  return html.replace(TAG_RE, " ").replace(WHITESPACE_RE, " ").trim();
}

export function extractFeedSummary(
  item: Pick<RenderedItem, "frontmatter" | "html">,
  maxLength: number = DEFAULT_SUMMARY_LENGTH,
): string {
  const explicit = item.frontmatter.summary?.trim();
  if (explicit) return explicit;
  const text = stripHtmlTags(item.html);
  if (text.length === 0) return "";
  const graphemes = [...text];
  if (graphemes.length <= maxLength) return text;
  return `${graphemes.slice(0, maxLength).join("")}…`;
}
