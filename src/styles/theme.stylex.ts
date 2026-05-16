import * as stylex from "@stylexjs/stylex";
import { colors } from "./tokens.stylex.ts";

export const lightTheme = stylex.createTheme(colors, {
  bgBase: "#fefefb",
  bgSurface: "#ffffff",
  bgElevated: "#f6f4ee",
  textPrimary: "#1a1a1c",
  textSecondary: "#3a3d44",
  textMuted: "#6b7079",
  borderSubtle: "#e8e6df",
  borderStrong: "#c9c5b8",
  link: "#0a5dad",
  linkHover: "#073f76",
  accent: "#7a3b1c",
  accentMuted: "#b06e44",
  focusRing: "#0a5dad",
  selection: "#fde8c4",
});

export const darkTheme = stylex.createTheme(colors, {
  bgBase: "#0e1014",
  bgSurface: "#161922",
  bgElevated: "#1d212c",
  textPrimary: "#e8eaed",
  textSecondary: "#b5b9c4",
  textMuted: "#838897",
  borderSubtle: "#262a36",
  borderStrong: "#3a3f4d",
  link: "#7cb1e8",
  linkHover: "#a6cbf0",
  accent: "#d68a5c",
  accentMuted: "#a06642",
  focusRing: "#7cb1e8",
  selection: "#3a4358",
});

const lightProps = stylex.props(lightTheme);
const darkProps = stylex.props(darkTheme);

export const themeClasses = {
  light: lightProps.className ?? "",
  dark: darkProps.className ?? "",
} as const;
