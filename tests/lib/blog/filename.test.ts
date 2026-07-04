import { describe, expect, it } from "vitest";
import { parseBlogSlugDate } from "@/lib/blog/filename.ts";

describe("parseBlogSlugDate", () => {
  it("正常なファイル名 stem をパースする", () => {
    expect(parseBlogSlugDate("2025-12-11 0930", "+09:00")).toEqual({
      slug: "2025-12-11 0930",
      createdIso: "2025-12-11T09:30:00+09:00",
      displayDate: "2025/12/11",
      anchorId: "p-2025-12-11-0930",
    });
  });

  it.each([
    // 時刻なし
    "2025-12-11",
    // コロン入り
    "2025-12-11 09:30",
    // 区切りが T
    "2025-12-11T0930",
    // 秒付き
    "2025-12-11 093000",
    // 13 月
    "2025-13-01 0930",
    // 非実在日
    "2025-02-30 0930",
    // 時刻範囲外
    "2025-12-11 2460",
    // 日付でない
    "メモ",
  ])("%s は null を返す", (slug) => {
    expect(parseBlogSlugDate(slug, "+09:00")).toBeNull();
  });
});
