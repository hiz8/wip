import type { ReactNode } from "react";
import { CONTENT_TYPE_LABELS } from "@/components/common/contentTypeLabels.ts";
import { Icon } from "@/components/common/Icon.tsx";

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
    renderIcon: (size) => <Icon type="home" size={size} />,
    isActive: sectionActive("/"),
  },
  {
    to: "/notes",
    label: CONTENT_TYPE_LABELS.notes,
    renderIcon: (size) => <Icon type="notebook" size={size} />,
    isActive: sectionActive("/notes"),
  },
  {
    to: "/glossary",
    label: CONTENT_TYPE_LABELS.glossary,
    renderIcon: (size) => <Icon type="notes" size={size} />,
    isActive: sectionActive("/glossary"),
  },
  {
    to: "/books",
    label: CONTENT_TYPE_LABELS.books,
    renderIcon: (size) => <Icon type="book" size={size} />,
    isActive: sectionActive("/books"),
  },
];
