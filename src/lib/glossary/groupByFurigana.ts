export type FuriganaGroup =
  | "あ行"
  | "か行"
  | "さ行"
  | "た行"
  | "な行"
  | "は行"
  | "ま行"
  | "や行"
  | "ら行"
  | "わ行"
  | "その他";

export const FURIGANA_GROUP_ORDER: readonly FuriganaGroup[] = [
  "あ行",
  "か行",
  "さ行",
  "た行",
  "な行",
  "は行",
  "ま行",
  "や行",
  "ら行",
  "わ行",
  "その他",
];

const HIRAGANA_TO_GROUP: Record<string, FuriganaGroup> = {
  // あ行 (vowels and small kana)
  あ: "あ行",
  い: "あ行",
  う: "あ行",
  え: "あ行",
  お: "あ行",
  ぁ: "あ行",
  ぃ: "あ行",
  ぅ: "あ行",
  ぇ: "あ行",
  ぉ: "あ行",
  // か行 (incl. dakuten)
  か: "か行",
  き: "か行",
  く: "か行",
  け: "か行",
  こ: "か行",
  が: "か行",
  ぎ: "か行",
  ぐ: "か行",
  げ: "か行",
  ご: "か行",
  // さ行
  さ: "さ行",
  し: "さ行",
  す: "さ行",
  せ: "さ行",
  そ: "さ行",
  ざ: "さ行",
  じ: "さ行",
  ず: "さ行",
  ぜ: "さ行",
  ぞ: "さ行",
  // た行 (incl. small tsu and dakuten)
  た: "た行",
  ち: "た行",
  つ: "た行",
  て: "た行",
  と: "た行",
  だ: "た行",
  ぢ: "た行",
  づ: "た行",
  で: "た行",
  ど: "た行",
  っ: "た行",
  // な行
  な: "な行",
  に: "な行",
  ぬ: "な行",
  ね: "な行",
  の: "な行",
  // は行 (incl. dakuten and handakuten)
  は: "は行",
  ひ: "は行",
  ふ: "は行",
  へ: "は行",
  ほ: "は行",
  ば: "は行",
  び: "は行",
  ぶ: "は行",
  べ: "は行",
  ぼ: "は行",
  ぱ: "は行",
  ぴ: "は行",
  ぷ: "は行",
  ぺ: "は行",
  ぽ: "は行",
  // ま行
  ま: "ま行",
  み: "ま行",
  む: "ま行",
  め: "ま行",
  も: "ま行",
  // や行 (incl. small ya/yu/yo)
  や: "や行",
  ゆ: "や行",
  よ: "や行",
  ゃ: "や行",
  ゅ: "や行",
  ょ: "や行",
  // ら行
  ら: "ら行",
  り: "ら行",
  る: "ら行",
  れ: "ら行",
  ろ: "ら行",
  // わ行 (incl. small wa and n)
  わ: "わ行",
  を: "わ行",
  ん: "わ行",
  ゎ: "わ行",
};

const KATAKANA_OFFSET = 0x60;
const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30fa;

export function groupByFurigana(furigana: string | undefined): FuriganaGroup {
  if (!furigana) return "その他";
  const trimmed = furigana.trim();
  if (trimmed.length === 0) return "その他";
  const first = trimmed.codePointAt(0);
  if (first === undefined) return "その他";
  const ch = normalizeToHiragana(first);
  return HIRAGANA_TO_GROUP[ch] ?? "その他";
}

function normalizeToHiragana(codePoint: number): string {
  if (codePoint >= KATAKANA_START && codePoint <= KATAKANA_END) {
    return String.fromCodePoint(codePoint - KATAKANA_OFFSET);
  }
  return String.fromCodePoint(codePoint);
}
