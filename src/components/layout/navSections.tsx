import type { IconType } from "@/components/common/Icon.tsx";
import { CONTENT_TYPE_LABELS } from "@/components/common/contentTypeLabels.ts";

// アイコンナビ (IconNav) とモバイルボトムナビ (MobileBottomNav) が共有するセクション
// 定義。ナビ構造とアクティブ判定をここに一元化し、各コンポーネントは見た目だけを担う。
export interface NavSection {
  to: "/" | "/notes" | "/glossary" | "/books" | "/blog";
  label: string;
  // 通常時とアクティブ時のアイコン種別。アクティブ表現を背景装飾ではなく字形 (bold) で
  // 示すため対で持つ。アイコンサイズは呼び出し側が指定する (レール=28 / ボトムナビ=22)。
  icon: IconType;
  iconActive: IconType;
  isActive: (path: string) => boolean;
}

// "/notes" と "/notes/..." の双方を現在地とみなす (ルート "/" のみ完全一致)。
const sectionActive = (base: string) => (path: string) =>
  base === "/" ? path === "/" : path === base || path.startsWith(`${base}/`);

export const NAV_SECTIONS: NavSection[] = [
  {
    to: "/",
    label: "Home",
    icon: "home",
    iconActive: "homeBold",
    isActive: sectionActive("/"),
  },
  {
    to: "/notes",
    label: CONTENT_TYPE_LABELS.notes,
    icon: "notebook",
    iconActive: "notebookBold",
    isActive: sectionActive("/notes"),
  },
  {
    to: "/glossary",
    label: CONTENT_TYPE_LABELS.glossary,
    icon: "notes",
    iconActive: "notesBold",
    isActive: sectionActive("/glossary"),
  },
  {
    to: "/books",
    label: CONTENT_TYPE_LABELS.books,
    icon: "book",
    iconActive: "bookBold",
    isActive: sectionActive("/books"),
  },
  {
    to: "/blog",
    label: CONTENT_TYPE_LABELS.blog,
    icon: "blog",
    iconActive: "blogBold",
    isActive: sectionActive("/blog"),
  },
];
