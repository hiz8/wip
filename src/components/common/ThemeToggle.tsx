import { useCallback } from "react";
import * as stylex from "@stylexjs/stylex";
import { a11y } from "@/styles/a11y.ts";
import { navChrome } from "@/styles/navChrome.ts";
import { Tooltip } from "@/components/common/Tooltip.tsx";
import { Icon } from "@/components/common/Icon.tsx";
import { useTheme } from "@/lib/theme/useTheme.ts";
import { nextPreference, type Preference } from "@/lib/theme/constants.ts";

const LABEL: Record<Preference, string> = {
  light: "テーマ: ライト",
  dark: "テーマ: ダーク",
};

function ThemeIcon({ preference }: { preference: Preference }) {
  return preference === "dark" ? <Icon type="moon" size={28} /> : <Icon type="sun" size={28} />;
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
