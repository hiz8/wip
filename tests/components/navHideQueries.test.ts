// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { RAIL_HIDE_QUERIES } from "@/components/layout/IconNav.tsx";
import { BAR_HIDE_QUERIES } from "@/components/layout/MobileBottomNav.tsx";
import { NAV_SECTIONS } from "@/components/layout/navSections.tsx";
import { desktopHideQuery, mobileHideQuery } from "@/lib/nav/overflowThresholds.ts";

// StyleX の制約 (同一ファイルのフラットな文字列 const) で各ナビはしきい値をリテラルに
// 持つため、導出式やセクション数との乖離をここで検出する。

describe("nav hide queries", () => {
  it("RAIL_HIDE_QUERIES は desktopHideQuery の出力・セクション数と一致する", () => {
    expect(RAIL_HIDE_QUERIES).toHaveLength(NAV_SECTIONS.length - 1);
    RAIL_HIDE_QUERIES.forEach((query, i) => {
      expect(query).toBe(desktopHideQuery(i + 1));
    });
  });

  it("BAR_HIDE_QUERIES は mobileHideQuery の出力・セクション数と一致する", () => {
    expect(BAR_HIDE_QUERIES).toHaveLength(NAV_SECTIONS.length - 1);
    BAR_HIDE_QUERIES.forEach((query, i) => {
      expect(query).toBe(mobileHideQuery(i + 1));
    });
  });
});
