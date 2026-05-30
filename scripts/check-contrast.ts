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
  { name: "bgBase", hex: "#fefefb" },
  { name: "bgSurface", hex: "#ffffff" },
  { name: "bgElevated", hex: "#f6f4ee" },
  { name: "textPrimary", hex: "#1a1a1c" },
  { name: "textSecondary", hex: "#3a3d44" },
  { name: "textMuted", hex: "#6b7079" },
  { name: "borderSubtle", hex: "#e8e6df" },
  { name: "borderStrong", hex: "#c9c5b8" },
  { name: "link", hex: "#0a5dad" },
  { name: "linkHover", hex: "#073f76" },
  { name: "accent", hex: "#7a3b1c" },
  { name: "focusRing", hex: "#0a5dad" },
  { name: "codeBg", hex: "#f4f1ea" },
  { name: "codeBorder", hex: "#918a7a" },
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
  { name: "bgBase", hex: "#0e1014" },
  { name: "bgSurface", hex: "#161922" },
  { name: "bgElevated", hex: "#1d212c" },
  { name: "textPrimary", hex: "#e8eaed" },
  { name: "textSecondary", hex: "#b5b9c4" },
  { name: "textMuted", hex: "#838897" },
  { name: "borderSubtle", hex: "#262a36" },
  { name: "borderStrong", hex: "#3a3f4d" },
  { name: "link", hex: "#7cb1e8" },
  { name: "linkHover", hex: "#a6cbf0" },
  { name: "accent", hex: "#d68a5c" },
  { name: "focusRing", hex: "#7cb1e8" },
  { name: "codeBg", hex: "#13161e" },
  { name: "codeBorder", hex: "#7a8090" },
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
