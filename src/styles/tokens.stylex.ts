import * as stylex from "@stylexjs/stylex";

const DARK = "@media (prefers-color-scheme: dark)";

export const colors = stylex.defineVars({
  bgBase: { default: "#fefefb", [DARK]: "#0e1014" },
  bgSurface: { default: "#ffffff", [DARK]: "#161922" },
  bgElevated: { default: "#f6f4ee", [DARK]: "#1d212c" },
  textPrimary: { default: "#1a1a1c", [DARK]: "#e8eaed" },
  textSecondary: { default: "#3a3d44", [DARK]: "#b5b9c4" },
  textMuted: { default: "#6b7079", [DARK]: "#838897" },
  borderSubtle: { default: "#e8e6df", [DARK]: "#262a36" },
  borderStrong: { default: "#c9c5b8", [DARK]: "#3a3f4d" },
  link: { default: "#0a5dad", [DARK]: "#7cb1e8" },
  linkHover: { default: "#073f76", [DARK]: "#a6cbf0" },
  accent: { default: "#7a3b1c", [DARK]: "#d68a5c" },
  accentMuted: { default: "#b06e44", [DARK]: "#a06642" },
  focusRing: { default: "#0a5dad", [DARK]: "#7cb1e8" },
  codeBg: { default: "#f4f1ea", [DARK]: "#13161e" },
  codeBorder: { default: "#dad6c8", [DARK]: "#262a36" },
  selection: { default: "#fde8c4", [DARK]: "#3a4358" },
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
  focus: "0 0 0 3px rgba(10, 93, 173, 0.35)",
});
