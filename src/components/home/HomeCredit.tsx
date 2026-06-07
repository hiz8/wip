import * as stylex from "@stylexjs/stylex";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

interface HomeCreditProps {
  authorName: string;
}

const styles = stylex.create({
  credit: {
    marginBlockStart: "auto",
    alignSelf: "flex-end",
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    fontFamily: typography.fontSans,
    fontSize: typography.fontSizeXs,
    letterSpacing: "0.02em",
    color: colors.textMuted,
  },
});

export function HomeCredit({ authorName }: HomeCreditProps) {
  return (
    <div {...stylex.props(styles.credit)}>
      <span>{authorName}</span>
      <span aria-hidden="true">·</span>
      <span>Digital Garden</span>
    </div>
  );
}
