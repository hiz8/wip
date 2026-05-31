/*
 * 本番に出すデザイントークンについて、WCAG 2.x の相対輝度とコントラスト比を
 * 計算する。Phase 8 で、テキスト・リンク・focus ring・コードブロック・callout が
 * light/dark 両テーマで AA を満たすことを検証するために使う。
 *
 * 実行: npx tsx scripts/check-contrast.ts
 */

interface Token {
  name: string;
  hex: string;
}

interface Pair {
  label: string;
  fg: string;
  bg: string;
  minAA: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = Number.parseInt(n.slice(0, 2), 16) / 255;
  const g = Number.parseInt(n.slice(2, 4), 16) / 255;
  const b = Number.parseInt(n.slice(4, 6), 16) / 255;
  return [r, g, b];
}

function channelLuminance(c: number): number {
  return c <= 0.039_28 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function contrast(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function find(tokens: Token[], name: string): string {
  const t = tokens.find((x) => x.name === name);
  if (!t) throw new Error(`token not found: ${name}`);
  return t.hex;
}

const lightTokens: Token[] = [
  { name: "bgBase", hex: "#FBFCFE" },
  { name: "bgSurface", hex: "#FBFCFE" },
  { name: "bgElevated", hex: "#EEF2F8" },
  { name: "textPrimary", hex: "#1C274C" },
  { name: "textSecondary", hex: "#3C4567" },
  { name: "textMuted", hex: "#6B7185" },
  { name: "borderSubtle", hex: "#DFE4EE" },
  { name: "borderStrong", hex: "#C2CADD" },
  { name: "link", hex: "#0D78AD" },
  { name: "linkHover", hex: "#0B6593" },
  { name: "accent", hex: "#091581" },
  { name: "focusRing", hex: "#0D78AD" },
  { name: "codeBg", hex: "#EAEEF6" },
  { name: "codeBorder", hex: "#7C849C" },
  { name: "selectedBg", hex: "#DFE6F2" },
  { name: "sidenoteMarker", hex: "#B22222" },
  { name: "navBg", hex: "#091581" },
  { name: "navIconActive", hex: "#FFFFFF" },
  { name: "calloutNoteBg", hex: "#eef4fb" },
  { name: "calloutNoteBorder", hex: "#5b8bc7" },
  { name: "calloutQuoteBg", hex: "#f5f1e8" },
  { name: "calloutQuoteBorder", hex: "#8e7a3f" },
  { name: "calloutTipBg", hex: "#eef7ee" },
  { name: "calloutTipBorder", hex: "#449448" },
  { name: "calloutInfoBg", hex: "#eaf3f5" },
  { name: "calloutInfoBorder", hex: "#3a838f" },
  { name: "calloutWarningBg", hex: "#fcf3e6" },
  { name: "calloutWarningBorder", hex: "#a87427" },
];

const darkTokens: Token[] = [
  { name: "bgBase", hex: "#1B2030" },
  { name: "bgSurface", hex: "#1B2030" },
  { name: "bgElevated", hex: "#232A3D" },
  { name: "textPrimary", hex: "#E8EAF1" },
  { name: "textSecondary", hex: "#C2C7D8" },
  { name: "textMuted", hex: "#9AA0B4" },
  { name: "borderSubtle", hex: "#343C52" },
  { name: "borderStrong", hex: "#454D66" },
  { name: "link", hex: "#2DBFEF" },
  { name: "linkHover", hex: "#5FD0F4" },
  { name: "accent", hex: "#7E94CE" },
  { name: "focusRing", hex: "#2DBFEF" },
  { name: "codeBg", hex: "#2A3247" },
  { name: "codeBorder", hex: "#7a8090" },
  { name: "selectedBg", hex: "#2C3650" },
  { name: "sidenoteMarker", hex: "#FF8A8A" },
  { name: "navBg", hex: "#091581" },
  { name: "navIconActive", hex: "#FFFFFF" },
  { name: "calloutNoteBg", hex: "#1a2535" },
  { name: "calloutNoteBorder", hex: "#5b8bc7" },
  { name: "calloutQuoteBg", hex: "#26221a" },
  { name: "calloutQuoteBorder", hex: "#8e7a3f" },
  { name: "calloutTipBg", hex: "#1a2a1d" },
  { name: "calloutTipBorder", hex: "#449448" },
  { name: "calloutInfoBg", hex: "#16282d" },
  { name: "calloutInfoBorder", hex: "#3a838f" },
  { name: "calloutWarningBg", hex: "#332618" },
  { name: "calloutWarningBorder", hex: "#a87427" },
];

const pairsFor = (t: Token[]): Pair[] => [
  { label: "textPrimary / bgBase", fg: find(t, "textPrimary"), bg: find(t, "bgBase"), minAA: 4.5 },
  {
    label: "textPrimary / bgSurface",
    fg: find(t, "textPrimary"),
    bg: find(t, "bgSurface"),
    minAA: 4.5,
  },
  {
    label: "textSecondary / bgBase",
    fg: find(t, "textSecondary"),
    bg: find(t, "bgBase"),
    minAA: 4.5,
  },
  { label: "textMuted / bgBase", fg: find(t, "textMuted"), bg: find(t, "bgBase"), minAA: 4.5 },
  {
    label: "textMuted / bgSurface",
    fg: find(t, "textMuted"),
    bg: find(t, "bgSurface"),
    minAA: 4.5,
  },
  { label: "link / bgBase", fg: find(t, "link"), bg: find(t, "bgBase"), minAA: 4.5 },
  { label: "linkHover / bgBase", fg: find(t, "linkHover"), bg: find(t, "bgBase"), minAA: 4.5 },
  { label: "accent / bgBase", fg: find(t, "accent"), bg: find(t, "bgBase"), minAA: 4.5 },
  { label: "focusRing / bgBase (UI)", fg: find(t, "focusRing"), bg: find(t, "bgBase"), minAA: 3 },
  // Tree / TOC の現在地: テキストは primary、accent は左ボーダー (UI) として selectedBg 上に乗る。
  {
    label: "textPrimary / selectedBg",
    fg: find(t, "textPrimary"),
    bg: find(t, "selectedBg"),
    minAA: 4.5,
  },
  {
    label: "accent / selectedBg (UI border)",
    fg: find(t, "accent"),
    bg: find(t, "selectedBg"),
    minAA: 3,
  },
  // 脚注 (sidenote) マーカーはテキスト扱い。
  {
    label: "sidenoteMarker / bgBase",
    fg: find(t, "sidenoteMarker"),
    bg: find(t, "bgBase"),
    minAA: 4.5,
  },
  // ナビレールのアクティブアイコン (白) は深ブルー背景の上。アイコン = UI (3:1)。
  {
    label: "navIconActive / navBg (UI)",
    fg: find(t, "navIconActive"),
    bg: find(t, "navBg"),
    minAA: 3,
  },
  { label: "textPrimary / codeBg", fg: find(t, "textPrimary"), bg: find(t, "codeBg"), minAA: 4.5 },
  {
    label: "codeBorder / bgBase (UI)",
    fg: find(t, "codeBorder"),
    bg: find(t, "bgBase"),
    minAA: 3,
  },
  {
    label: "codeBorder / codeBg (UI)",
    fg: find(t, "codeBorder"),
    bg: find(t, "codeBg"),
    minAA: 3,
  },
  {
    label: "textPrimary / calloutNoteBg",
    fg: find(t, "textPrimary"),
    bg: find(t, "calloutNoteBg"),
    minAA: 4.5,
  },
  {
    label: "calloutNoteBorder / bgBase (UI)",
    fg: find(t, "calloutNoteBorder"),
    bg: find(t, "bgBase"),
    minAA: 3,
  },
  {
    label: "textPrimary / calloutQuoteBg",
    fg: find(t, "textPrimary"),
    bg: find(t, "calloutQuoteBg"),
    minAA: 4.5,
  },
  {
    label: "calloutQuoteBorder / bgBase (UI)",
    fg: find(t, "calloutQuoteBorder"),
    bg: find(t, "bgBase"),
    minAA: 3,
  },
  {
    label: "textPrimary / calloutTipBg",
    fg: find(t, "textPrimary"),
    bg: find(t, "calloutTipBg"),
    minAA: 4.5,
  },
  {
    label: "calloutTipBorder / bgBase (UI)",
    fg: find(t, "calloutTipBorder"),
    bg: find(t, "bgBase"),
    minAA: 3,
  },
  {
    label: "textPrimary / calloutInfoBg",
    fg: find(t, "textPrimary"),
    bg: find(t, "calloutInfoBg"),
    minAA: 4.5,
  },
  {
    label: "calloutInfoBorder / bgBase (UI)",
    fg: find(t, "calloutInfoBorder"),
    bg: find(t, "bgBase"),
    minAA: 3,
  },
  {
    label: "textPrimary / calloutWarningBg",
    fg: find(t, "textPrimary"),
    bg: find(t, "calloutWarningBg"),
    minAA: 4.5,
  },
  {
    label: "calloutWarningBorder / bgBase (UI)",
    fg: find(t, "calloutWarningBorder"),
    bg: find(t, "bgBase"),
    minAA: 3,
  },
];

function report(theme: string, tokens: Token[]) {
  const pairs = pairsFor(tokens);
  let fail = 0;
  console.log(`\n=== ${theme} ===`);
  console.log("| pair | ratio | min | status |");
  console.log("| --- | --- | --- | --- |");
  for (const p of pairs) {
    const r = contrast(p.fg, p.bg);
    const ok = r >= p.minAA;
    if (!ok) fail += 1;
    console.log(`| ${p.label} | ${r.toFixed(2)}:1 | ${p.minAA}:1 | ${ok ? "PASS" : "FAIL"} |`);
  }
  return fail;
}

const lightFail = report("light", lightTokens);
const darkFail = report("dark", darkTokens);

console.log(`\nTotal failures: light=${lightFail}, dark=${darkFail}`);

if (lightFail + darkFail > 0) {
  process.exitCode = 1;
}
