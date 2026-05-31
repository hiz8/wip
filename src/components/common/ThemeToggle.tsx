import { useCallback } from "react";
import * as stylex from "@stylexjs/stylex";
import { a11y } from "@/styles/a11y.ts";
import { navChrome } from "@/styles/navChrome.ts";
import { useTheme } from "@/lib/theme/useTheme.ts";
import { nextPreference, type Preference } from "@/lib/theme/constants.ts";

const LABEL: Record<Preference, string> = {
  system: "テーマ: システム",
  light: "テーマ: ライト",
  dark: "テーマ: ダーク",
};

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 13a9 9 0 11-10-10 7 7 0 0010 10z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AutoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3a9 9 0 010 18z" fill="currentColor" />
    </svg>
  );
}

function Icon({ preference }: { preference: Preference }) {
  switch (preference) {
    case "light":
      return <SunIcon />;
    case "dark":
      return <MoonIcon />;
    default:
      return <AutoIcon />;
  }
}

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const handleClick = useCallback(() => {
    setPreference(nextPreference(preference));
  }, [preference, setPreference]);
  return (
    <button
      type="button"
      aria-label={LABEL[preference]}
      title={LABEL[preference]}
      onClick={handleClick}
      {...stylex.props(navChrome.iconButton)}
    >
      <Icon preference={preference} />
      <span {...stylex.props(a11y.srOnly)}>{LABEL[preference]}</span>
    </button>
  );
}
