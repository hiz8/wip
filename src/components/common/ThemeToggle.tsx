import { useCallback } from "react";
import * as stylex from "@stylexjs/stylex";
import { a11y } from "@/styles/a11y.ts";
import { navChrome } from "@/styles/navChrome.ts";
import { Tooltip } from "@/components/common/Tooltip.tsx";
import { Icon } from "@/components/common/Icon.tsx";
import { useTheme } from "@/lib/theme/useTheme.ts";
import { nextPreference, type Preference } from "@/lib/theme/constants.ts";

const LABEL: Record<Preference, string> = {
  system: "テーマ: システム",
  light: "テーマ: ライト",
  dark: "テーマ: ダーク",
};

function AutoIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 3a9 9 0 010 18z" fill="currentColor" />
    </svg>
  );
}

function ThemeIcon({ preference }: { preference: Preference }) {
  switch (preference) {
    case "light":
      return <Icon type="sun" size={28} />;
    case "dark":
      return <Icon type="moon" size={28} />;
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
    <Tooltip label={LABEL[preference]}>
      <button
        type="button"
        aria-label={LABEL[preference]}
        onClick={handleClick}
        {...stylex.props(navChrome.iconButton)}
      >
        <ThemeIcon preference={preference} />
        <span {...stylex.props(a11y.srOnly)}>{LABEL[preference]}</span>
      </button>
    </Tooltip>
  );
}
