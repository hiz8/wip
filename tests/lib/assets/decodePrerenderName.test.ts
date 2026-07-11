import { describe, expect, it } from "vitest";
import { decodeAssetSegment } from "@/lib/assets/decodePrerenderName.ts";

describe("decodeAssetSegment", () => {
  it("デコードで変化しない ASCII 名は null (リネーム不要)", () => {
    expect(decodeAssetSegment("PPA")).toBeNull();
    expect(decodeAssetSegment("index.html")).toBeNull();
    expect(decodeAssetSegment("AI")).toBeNull();
  });

  it("%20 をスペースへデコードする", () => {
    expect(decodeAssetSegment("Version%20Skew")).toBe("Version Skew");
  });

  it("percent-encode された日本語をデコードする", () => {
    expect(
      decodeAssetSegment("%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%93%E3%83%AA%E3%83%86%E3%82%A3"),
    ).toBe("ユーザビリティ");
  });

  it("スペースと日本語の混在名をデコードする", () => {
    expect(
      decodeAssetSegment(
        "Four-Quadrant%20Canvas%20%E3%81%AB%E3%81%8A%E3%82%8B%E3%83%87%E3%82%B6%E3%82%A4%E3%83%B3",
      ),
    ).toBe("Four-Quadrant Canvas におるデザイン");
  });

  it("+ は form-encoding ではないので変更しない (blog tagset の区切り)", () => {
    expect(decodeAssetSegment("Notion+UI")).toBeNull();
  });

  it("%25 は literal % へデコードする", () => {
    expect(decodeAssetSegment("50%25off")).toBe("50%off");
  });

  it("不正な percent シーケンスは null (素の % を含む実ファイル名を壊さない)", () => {
    expect(decodeAssetSegment("100%")).toBeNull();
    expect(decodeAssetSegment("bad%zzname")).toBeNull();
  });

  it("パス構造を変えるデコード結果 (/ や .. など) は null", () => {
    expect(decodeAssetSegment("a%2Fb")).toBeNull();
    expect(decodeAssetSegment("%2E%2E")).toBeNull();
    expect(decodeAssetSegment("%2e")).toBeNull();
    expect(decodeAssetSegment("a%5Cb")).toBeNull();
  });

  it("空文字へのデコードは null", () => {
    expect(decodeAssetSegment("")).toBeNull();
  });
});
