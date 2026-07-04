import type { ContentType } from "@/types/content.ts";

// コンテンツタイプのセクション表示名。ナビ・ホームの各所で共有し、表記を一元化する。
export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  notes: "Notes",
  glossary: "Glossary",
  books: "Books",
  blog: "Blog",
};
