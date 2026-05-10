import * as stylex from "@stylexjs/stylex";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface GlossaryHeaderProps {
  term: string;
  furigana: string | null;
  aliases: readonly string[];
}

const styles = stylex.create({
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
    marginBottom: space.s5,
  },
  furigana: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted,
  },
  title: {
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightSemibold,
    lineHeight: typography.lineHeightTight,
    margin: 0,
    color: colors.textPrimary,
  },
  aliasesRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s1,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  alias: {
    display: "inline-block",
    paddingInline: space.s2,
    paddingBlock: 0,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
  },
});

export function GlossaryHeader({ term, furigana, aliases }: GlossaryHeaderProps) {
  return (
    <header {...stylex.props(styles.header)}>
      {furigana !== null && furigana.trim() !== "" && (
        <span {...stylex.props(styles.furigana)}>{furigana}</span>
      )}
      <h1 {...stylex.props(styles.title)}>{term}</h1>
      {aliases.length > 0 && (
        <ul {...stylex.props(styles.aliasesRow)} role="list" aria-label="Aliases">
          {aliases.map((alias) => (
            <li key={alias} {...stylex.props(styles.alias)}>
              {alias}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
