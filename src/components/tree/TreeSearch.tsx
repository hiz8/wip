import * as stylex from "@stylexjs/stylex";
import { Button, Input, TextField } from "react-aria-components";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface TreeSearchProps {
  value: string;
  onChange: (next: string) => void;
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
    border: `1px solid ${colors.borderSubtle}`,
    fontSize: typography.fontSizeSm,
  },
  input: {
    flex: 1,
    border: 0,
    outline: 0,
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

export function TreeSearch({ value, onChange }: TreeSearchProps) {
  return (
    <TextField value={value} onChange={onChange} aria-label="Filter notes">
      <div {...stylex.props(styles.field)}>
        <Input placeholder="Filter…" {...stylex.props(styles.input)} />
        {value !== "" && (
          <Button
            slot={null}
            aria-label="Clear filter"
            onPress={() => onChange("")}
            {...stylex.props(styles.clear)}
          >
            ✕
          </Button>
        )}
      </div>
    </TextField>
  );
}
