import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import type { FootnoteEntry } from "@/types/content.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

interface FootnoteSectionProps {
  footnotes: readonly FootnoteEntry[];
  /** id 名前空間の接頭辞 (Blog は記事ごとに固有の空間を持つ)。省略時は既定の `user-content-`。 */
  idPrefix?: string;
}

const styles = stylex.create({
  section: {
    marginTop: space.s7,
    paddingTop: space.s4,
    borderBlockStartWidth: 1,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: colors.borderSubtle,
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  heading: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightSemibold,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: colors.textMuted,
    marginBottom: space.s3,
  },
  list: {
    listStyle: "decimal",
    paddingInlineStart: space.s5,
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  item: {
    paddingInlineStart: space.s1,
  },
});

function FootnoteItem({ footnote, idPrefix }: { footnote: FootnoteEntry; idPrefix: string }) {
  // プロジェクトの react-perf lint ルール (jsx-no-new-object-as-prop) を満たすため、
  // dangerouslySetInnerHTML の prop オブジェクトをメモ化する。
  const html = useMemo(() => ({ __html: footnote.html }), [footnote.html]);
  return (
    <li
      id={`${idPrefix}fn-${footnote.id}`}
      {...stylex.props(styles.item)}
      dangerouslySetInnerHTML={html}
    />
  );
}

export function FootnoteSection({ footnotes, idPrefix }: FootnoteSectionProps) {
  if (footnotes.length === 0) return null;
  const prefix = idPrefix ?? "user-content-";
  return (
    <section {...stylex.props(styles.section)} data-footnote-section aria-label="Footnotes">
      <h2 {...stylex.props(styles.heading)}>Footnotes</h2>
      <ol {...stylex.props(styles.list)}>
        {footnotes.map((footnote) => (
          <FootnoteItem key={footnote.id} footnote={footnote} idPrefix={prefix} />
        ))}
      </ol>
    </section>
  );
}
