import { describe, expect, it } from "vitest";
import { desktopHideQuery, mobileHideQuery } from "@/lib/nav/overflowThresholds.ts";

// しきい値の導出は docs/superpowers/specs/2026-07-11-nav-overflow-menu-design.md を参照。
// NAV_SECTIONS = [Home, Notes, Glossary, Books, Blog] の index 1..4 が退避対象。

const px = (q: string) => Number(/(\d+)px/u.exec(q)?.[1]);

describe("mobileHideQuery", () => {
  it("タブ幅 56px を確保できない幅でセクションを隠す (vw ≤ 56×(index+2))", () => {
    expect(mobileHideQuery(1)).toBe("@media (max-width: 168px)");
    expect(mobileHideQuery(2)).toBe("@media (max-width: 224px)");
    expect(mobileHideQuery(3)).toBe("@media (max-width: 280px)");
    expect(mobileHideQuery(4)).toBe("@media (max-width: 336px)");
  });
});

describe("desktopHideQuery", () => {
  it("レール所要高 (60S+220) を確保できない高さでセクションを隠す", () => {
    expect(desktopHideQuery(1)).toBe("@media (max-height: 340px)");
    expect(desktopHideQuery(2)).toBe("@media (max-height: 400px)");
    expect(desktopHideQuery(3)).toBe("@media (max-height: 460px)");
    expect(desktopHideQuery(4)).toBe("@media (max-height: 520px)");
  });

  it("末端に近いセクションほど広い (= 早く発動する) しきい値を持つ", () => {
    expect(px(desktopHideQuery(4))).toBeGreaterThan(px(desktopHideQuery(1)));
    expect(px(mobileHideQuery(4))).toBeGreaterThan(px(mobileHideQuery(1)));
  });
});
