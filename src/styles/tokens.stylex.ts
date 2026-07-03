import * as stylex from "@stylexjs/stylex";

const DARK = "@media (prefers-color-scheme: dark)";

export const colors = stylex.defineVars({
  bgBase: { default: "#FBFCFE", [DARK]: "#1B2030" },
  bgSurface: { default: "#FBFCFE", [DARK]: "#1B2030" },
  bgElevated: { default: "#EEF2F8", [DARK]: "#232A3D" },
  textPrimary: { default: "#1C274C", [DARK]: "#E8EAF1" },
  textSecondary: { default: "#3C4567", [DARK]: "#C2C7D8" },
  textMuted: { default: "#6B7185", [DARK]: "#9AA0B4" },
  borderSubtle: { default: "#DFE4EE", [DARK]: "#343C52" },
  borderStrong: { default: "#C2CADD", [DARK]: "#454D66" },
  link: { default: "#0D78AD", [DARK]: "#2DBFEF" },
  linkHover: { default: "#0B6593", [DARK]: "#5FD0F4" },
  accent: { default: "#091581", [DARK]: "#7E94CE" },
  accentMuted: { default: "#3A48A0", [DARK]: "#5E72A6" },
  focusRing: { default: "#0D78AD", [DARK]: "#2DBFEF" },
  codeBg: "var(--code-bg)",
  codeBorder: "var(--code-border)",
  // Tree / TOC の現在地ハイライト。bgElevated はサイドバー背景に使うため、
  // ハイライトが埋もれないよう専用トークンを設ける。
  selectedBg: { default: "#DFE6F2", [DARK]: "#2C3650" },
  hoverBg: { default: "rgba(28, 39, 76, 0.06)", [DARK]: "rgba(255, 255, 255, 0.05)" },
  // 脚注 (Tufte sidenote) のマーカー番号。
  sidenoteMarker: { default: "#B22222", [DARK]: "#FF8A8A" },
  // タグチップ背景。
  tagBg: { default: "#E6EBF4", [DARK]: "#2E3650" },
  // ナビレールは両テーマで深ブルー固定 (テーマで変化しないため plain string)。
  navBg: "#091581",
  navIcon: "rgba(255, 255, 255, 0.85)",
  navIconActive: "#FFFFFF",
  navItemHoverBg: "rgba(255, 255, 255, 0.10)",
  navItemActiveBg: "rgba(255, 255, 255, 0.18)",
  navBorder: "rgba(255, 255, 255, 0.08)",
  calloutNoteBg: "var(--callout-note-bg)",
  calloutNoteBorder: "var(--callout-note-border)",
  calloutQuoteBg: "var(--callout-quote-bg)",
  calloutQuoteBorder: "var(--callout-quote-border)",
  calloutTipBg: "var(--callout-tip-bg)",
  calloutTipBorder: "var(--callout-tip-border)",
  calloutInfoBg: "var(--callout-info-bg)",
  calloutInfoBorder: "var(--callout-info-border)",
  calloutWarningBg: "var(--callout-warning-bg)",
  calloutWarningBorder: "var(--callout-warning-border)",
});

export const space = stylex.defineVars({
  s0: "0",
  s1: "0.25rem",
  s2: "0.5rem",
  s3: "0.75rem",
  s4: "1rem",
  s5: "1.5rem",
  s6: "2rem",
  s7: "3rem",
  s8: "4rem",
  s9: "6rem",
});

export const radius = stylex.defineVars({
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  pill: "999px",
  circle: "50%",
});

export const typography = stylex.defineVars({
  fontSans: "var(--font-sans)",
  fontBrand: "var(--font-brand)",
  fontMono: "var(--font-mono)",
  fontSerif: "var(--font-serif)",
  fontSizeXs: "0.75rem",
  fontSizeSm: "0.875rem",
  fontSizeBase: "1rem",
  fontSizeMd: "1.125rem",
  fontSizeLg: "1.25rem",
  fontSizeXl: "1.5rem",
  fontSize2xl: "1.875rem",
  fontSize3xl: "2.25rem",
  // バナーのサイトタイトル用 (≈52px)。
  fontSize4xl: "3.25rem",
  lineHeightTight: "1.25",
  lineHeightNormal: "1.5",
  lineHeightRelaxed: "1.75",
  weightRegular: "400",
  weightMedium: "500",
  weightSemibold: "600",
  weightBold: "700",
});

export const shadow = stylex.defineVars({
  sm: "0 1px 2px rgba(0, 0, 0, 0.04)",
  md: "0 2px 8px rgba(0, 0, 0, 0.06)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.08)",
  focus: "0 0 0 3px rgba(14, 127, 184, 0.35)",
  // 書影など、立体的に浮かせるカード用。
  book: "0 6px 14px rgba(28, 39, 76, 0.18), 0 2px 4px rgba(28, 39, 76, 0.10)",
});
