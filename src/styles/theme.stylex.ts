import * as stylex from "@stylexjs/stylex";
import { colors } from "./tokens.stylex.ts";

// createTheme は defineVars の全キーを要求しない (上書きしないキーは defineVars の
// default にフォールバックする)。codeBg / callout* のように CSS var 由来で
// [data-theme-resolved="dark"] 側で切り替わるキー、および両テーマ同値の nav 系
// キーはここに含めない。テーマで色が変わる純 StyleX 値のキーだけをミラーする。
export const lightTheme = stylex.createTheme(colors, {
  bgBase: "#FBFCFE",
  bgSurface: "#FBFCFE",
  bgElevated: "#EEF2F8",
  textPrimary: "#1C274C",
  textSecondary: "#3C4567",
  textMuted: "#6B7185",
  borderSubtle: "#DFE4EE",
  borderStrong: "#C2CADD",
  link: "#0D78AD",
  linkHover: "#0B6593",
  accent: "#091581",
  accentMuted: "#3A48A0",
  focusRing: "#0D78AD",
  selection: "#DFE6F2",
  selectedBg: "#DFE6F2",
  hoverBg: "rgba(28, 39, 76, 0.06)",
  sidenoteMarker: "#B22222",
  tagBg: "#E6EBF4",
});

export const darkTheme = stylex.createTheme(colors, {
  bgBase: "#1B2030",
  bgSurface: "#1B2030",
  bgElevated: "#232A3D",
  textPrimary: "#E8EAF1",
  textSecondary: "#C2C7D8",
  textMuted: "#9AA0B4",
  borderSubtle: "#343C52",
  borderStrong: "#454D66",
  link: "#2DBFEF",
  linkHover: "#5FD0F4",
  accent: "#7E94CE",
  accentMuted: "#5E72A6",
  focusRing: "#2DBFEF",
  selection: "#2C3650",
  selectedBg: "#2C3650",
  hoverBg: "rgba(255, 255, 255, 0.05)",
  sidenoteMarker: "#FF8A8A",
  tagBg: "#2E3650",
});

const lightProps = stylex.props(lightTheme);
const darkProps = stylex.props(darkTheme);

export const themeClasses = {
  light: lightProps.className ?? "",
  dark: darkProps.className ?? "",
} as const;
