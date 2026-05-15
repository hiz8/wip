import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { CalloutKindIcon } from "./CalloutKindIcon.tsx";
import type { CalloutEntry, CalloutKind, FootnoteEntry } from "@/types/content.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface FootnoteItemProps {
  index: number;
  footnote: FootnoteEntry;
}

interface CalloutItemProps {
  callout: CalloutEntry;
}

const styles = stylex.create({
  root: {
    fontSize: typography.fontSizeXs,
    lineHeight: typography.lineHeightNormal,
    color: colors.textSecondary,
  },
  footnote: {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    columnGap: space.s2,
    alignItems: "start",
  },
  footnoteLabel: {
    fontWeight: typography.weightSemibold,
    color: colors.accent,
  },
  footnoteBody: {
    minWidth: 0,
  },
  callout: {
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
    paddingInline: space.s3,
    paddingBlock: space.s2,
    borderRadius: radius.md,
    borderInlineStartWidth: 3,
    borderInlineStartStyle: "solid",
  },
  calloutHeader: {
    display: "flex",
    alignItems: "center",
    gap: space.s1,
    color: colors.textPrimary,
    fontWeight: typography.weightSemibold,
  },
  calloutBody: {
    minWidth: 0,
  },
  noteAccent: {
    backgroundColor: colors.calloutNoteBg,
    borderInlineStartColor: colors.calloutNoteBorder,
  },
  quoteAccent: {
    backgroundColor: colors.calloutQuoteBg,
    borderInlineStartColor: colors.calloutQuoteBorder,
  },
  tipAccent: {
    backgroundColor: colors.calloutTipBg,
    borderInlineStartColor: colors.calloutTipBorder,
  },
  infoAccent: {
    backgroundColor: colors.calloutInfoBg,
    borderInlineStartColor: colors.calloutInfoBorder,
  },
  warningAccent: {
    backgroundColor: colors.calloutWarningBg,
    borderInlineStartColor: colors.calloutWarningBorder,
  },
});

const ACCENT_STYLES: Record<CalloutKind, stylex.StyleXStyles> = {
  note: styles.noteAccent,
  quote: styles.quoteAccent,
  tip: styles.tipAccent,
  info: styles.infoAccent,
  warning: styles.warningAccent,
};

export function MarginaliaFootnote({ index, footnote }: FootnoteItemProps) {
  const html = useMemo(() => ({ __html: footnote.html }), [footnote.html]);
  return (
    <div {...stylex.props(styles.root, styles.footnote)}>
      <span {...stylex.props(styles.footnoteLabel)}>{index}.</span>
      <div
        {...stylex.props(styles.footnoteBody)}
        data-marginalia-html
        dangerouslySetInnerHTML={html}
      />
    </div>
  );
}

export function MarginaliaCallout({ callout }: CalloutItemProps) {
  const html = useMemo(() => ({ __html: callout.html }), [callout.html]);
  return (
    <aside {...stylex.props(styles.root, styles.callout, ACCENT_STYLES[callout.kind])}>
      <header {...stylex.props(styles.calloutHeader)}>
        <CalloutKindIcon kind={callout.kind} size={14} />
        {callout.title ? <span>{callout.title}</span> : null}
      </header>
      <div
        {...stylex.props(styles.calloutBody)}
        data-marginalia-html
        dangerouslySetInnerHTML={html}
      />
    </aside>
  );
}
