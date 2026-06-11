import type { ReactNode } from "react";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import { CONTENT_TYPE_LABELS } from "@/components/common/contentTypeLabels.ts";
import { HomeIcon } from "@/components/common/HomeIcon.tsx";

// アイコンナビ (IconNav) とモバイルボトムナビ (MobileBottomNav) が共有するセクション
// 定義。ナビ構造とアクティブ判定をここに一元化し、各コンポーネントは見た目だけを担う。
export interface NavSection {
  to: "/" | "/notes" | "/glossary" | "/books";
  label: string;
  // アイコンサイズは呼び出し側が指定する (レール=20 / ボトムナビ=22)。
  renderIcon: (size: number) => ReactNode;
  isActive: (path: string) => boolean;
}

// "/notes" と "/notes/..." の双方を現在地とみなす (ルート "/" のみ完全一致)。
const sectionActive = (base: string) => (path: string) =>
  base === "/" ? path === "/" : path === base || path.startsWith(`${base}/`);

export const NAV_SECTIONS: NavSection[] = [
  {
    to: "/",
    label: "Home",
    renderIcon: (size) => <HomeIcon size={size} />,
    isActive: sectionActive("/"),
  },
  {
    to: "/notes",
    label: CONTENT_TYPE_LABELS.notes,
    renderIcon: (size) => <ContentTypeIcon type="notes" size={size} />,
    isActive: sectionActive("/notes"),
  },
  {
    to: "/glossary",
    label: CONTENT_TYPE_LABELS.glossary,
    renderIcon: (size) => <ContentTypeIcon type="glossary" size={size} />,
    isActive: sectionActive("/glossary"),
  },
  {
    to: "/books",
    label: CONTENT_TYPE_LABELS.books,
    renderIcon: (size) => <ContentTypeIcon type="books" size={size} />,
    isActive: sectionActive("/books"),
  },
];
