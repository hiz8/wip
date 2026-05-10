import { useCallback } from "react";
import * as stylex from "@stylexjs/stylex";
import { Button, Input, TextField } from "react-aria-components";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface TreeSearchProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

const styles = stylex.create({
  field: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    paddingInline: space.s3,
    paddingBlock: space.s2,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    fontSize: typography.fontSizeSm,
  },
  input: {
    flexGrow: 1,
    borderStyle: "none",
    outlineStyle: "none",
    backgroundColor: "transparent",
    color: colors.textPrimary,
  },
  clear: {
    color: colors.textMuted,
    fontSize: typography.fontSizeXs,
    paddingInline: space.s1,
    cursor: "pointer",
  },
});

export function TreeSearch({
  value,
  onChange,
  placeholder = "Filter…",
  ariaLabel = "Filter",
}: TreeSearchProps) {
  const handleClear = useCallback(() => onChange(""), [onChange]);
  return (
    <TextField value={value} onChange={onChange} aria-label={ariaLabel}>
      <div {...stylex.props(styles.field)}>
        <Input placeholder={placeholder} {...stylex.props(styles.input)} />
        {value !== "" && (
          <Button
            slot={null}
            aria-label="Clear filter"
            onPress={handleClear}
            {...stylex.props(styles.clear)}
          >
            ✕
          </Button>
        )}
      </div>
    </TextField>
  );
}
