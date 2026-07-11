import { useMemo } from "react";
import { useOverflowCount } from "@/lib/nav/useOverflowCount.ts";
import { MENU_NAV_SECTIONS, type MenuNavSection, NAV_SECTIONS } from "./navSections.tsx";

// CSS (hide media query) で退避した末尾セクション数をメニュー内容へ反映する。
// 戻り値はドットメニューに出すセクション (退避分 + 常時メニュー分、NAV_SECTIONS 順)。
// IconNav (高さしきい値) と MobileBottomNav (幅しきい値) がそれぞれのクエリで共有する。
export function useMenuSections(hideQueries: readonly string[]): MenuNavSection[] {
  const overflowCount = useOverflowCount(hideQueries);
  const visibleCount = NAV_SECTIONS.length - overflowCount;
  return useMemo(() => [...NAV_SECTIONS.slice(visibleCount), ...MENU_NAV_SECTIONS], [visibleCount]);
}
