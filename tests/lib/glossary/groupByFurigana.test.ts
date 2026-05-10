import { describe, expect, it } from "vitest";
import { FURIGANA_GROUP_ORDER, groupByFurigana } from "@/lib/glossary/groupByFurigana.ts";

describe("groupByFurigana", () => {
  it("各行の代表的なひらがなを正しい行に分類する", () => {
    expect(groupByFurigana("あいうえお")).toBe("あ行");
    expect(groupByFurigana("かきくけこ")).toBe("か行");
    expect(groupByFurigana("さしすせそ")).toBe("さ行");
    expect(groupByFurigana("たちつてと")).toBe("た行");
    expect(groupByFurigana("なにぬねの")).toBe("な行");
    expect(groupByFurigana("はひふへほ")).toBe("は行");
    expect(groupByFurigana("まみむめも")).toBe("ま行");
    expect(groupByFurigana("やゆよ")).toBe("や行");
    expect(groupByFurigana("らりるれろ")).toBe("ら行");
    expect(groupByFurigana("わをん")).toBe("わ行");
  });

  it("濁音は対応する清音の行に振り分ける", () => {
    expect(groupByFurigana("がぎぐげご")).toBe("か行");
    expect(groupByFurigana("ざじずぜぞ")).toBe("さ行");
    expect(groupByFurigana("だぢづでど")).toBe("た行");
    expect(groupByFurigana("ばびぶべぼ")).toBe("は行");
  });

  it("半濁音は は行 に分類する", () => {
    expect(groupByFurigana("ぱぴぷぺぽ")).toBe("は行");
  });

  it("拗音 / 促音は対応する清音の行に振り分ける", () => {
    expect(groupByFurigana("ぁ")).toBe("あ行");
    expect(groupByFurigana("ぃ")).toBe("あ行");
    expect(groupByFurigana("っ")).toBe("た行");
    expect(groupByFurigana("ゃ")).toBe("や行");
    expect(groupByFurigana("ゅ")).toBe("や行");
    expect(groupByFurigana("ょ")).toBe("や行");
    expect(groupByFurigana("ゎ")).toBe("わ行");
  });

  it("カタカナはひらがな相当の行に分類する", () => {
    expect(groupByFurigana("リアクト")).toBe("ら行");
    expect(groupByFurigana("カタカナ")).toBe("か行");
    // ヴ is out of the explicit mapping table, so it falls through.
    expect(groupByFurigana("ヴ")).toBe("その他");
  });

  it("furigana 未指定 / 空文字は その他 に分類する", () => {
    const noArg: string | undefined = undefined;
    expect(groupByFurigana(noArg)).toBe("その他");
    expect(groupByFurigana("")).toBe("その他");
    expect(groupByFurigana("   ")).toBe("その他");
  });

  it("英数字 / 記号は その他 に分類する", () => {
    expect(groupByFurigana("CSR")).toBe("その他");
    expect(groupByFurigana("123")).toBe("その他");
    expect(groupByFurigana("ー")).toBe("その他");
  });

  it("FURIGANA_GROUP_ORDER は あ行 から その他 までの 11 件", () => {
    expect(FURIGANA_GROUP_ORDER.length).toBe(11);
    expect(FURIGANA_GROUP_ORDER.at(0)).toBe("あ行");
    expect(FURIGANA_GROUP_ORDER.at(-1)).toBe("その他");
  });
});
