import * as stylex from "@stylexjs/stylex";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

const BP_DESKTOP = "@media (min-width: 1024px)";

interface BookHeaderProps {
  title: string;
  authors: readonly string[];
  isbn: string;
  pubYear: number | null;
  publisher: string | null;
  readDate: string | null;
  coverUrl: string | null;
}

const styles = stylex.create({
  header: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", [BP_DESKTOP]: "minmax(160px, 12rem) 1fr" },
    gap: space.s4,
    marginBottom: space.s5,
    paddingBottom: space.s4,
    borderBlockEndWidth: 1,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: colors.borderSubtle,
  },
  coverPlaceholder: {
    aspectRatio: "3 / 4",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
    fontSize: typography.fontSizeSm,
    textAlign: "center",
    paddingInline: space.s3,
    paddingBlock: space.s3,
    maxWidth: { default: "12rem", [BP_DESKTOP]: "100%" },
    marginInline: { default: "auto", [BP_DESKTOP]: 0 },
  },
  coverImage: {
    aspectRatio: "3 / 4",
    width: { default: "auto", [BP_DESKTOP]: "100%" },
    maxWidth: { default: "12rem", [BP_DESKTOP]: "100%" },
    height: "auto",
    objectFit: "cover",
    backgroundColor: colors.bgElevated,
    borderRadius: radius.sm,
    display: "block",
    marginInline: { default: "auto", [BP_DESKTOP]: 0 },
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  title: {
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightBold,
    lineHeight: typography.lineHeightTight,
    margin: 0,
    color: colors.textPrimary,
  },
  metaRow: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  metaLabel: {
    color: colors.textMuted,
    marginInlineEnd: space.s2,
  },
});

export function BookHeader({
  title,
  authors,
  isbn,
  pubYear,
  publisher,
  readDate,
  coverUrl,
}: BookHeaderProps) {
  return (
    <header {...stylex.props(styles.header)}>
      {coverUrl === null ? (
        <div {...stylex.props(styles.coverPlaceholder)} aria-hidden="true">
          {title}
        </div>
      ) : (
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          decoding="async"
          {...stylex.props(styles.coverImage)}
        />
      )}
      <div {...stylex.props(styles.meta)}>
        <h1 {...stylex.props(styles.title)}>{title}</h1>
        {authors.length > 0 && (
          <p {...stylex.props(styles.metaRow)}>
            <span {...stylex.props(styles.metaLabel)}>Authors</span>
            {authors.join(", ")}
          </p>
        )}
        {pubYear !== null && (
          <p {...stylex.props(styles.metaRow)}>
            <span {...stylex.props(styles.metaLabel)}>Published</span>
            {pubYear}
          </p>
        )}
        {publisher !== null && publisher.trim() !== "" && (
          <p {...stylex.props(styles.metaRow)}>
            <span {...stylex.props(styles.metaLabel)}>Publisher</span>
            {publisher}
          </p>
        )}
        <p {...stylex.props(styles.metaRow)}>
          <span {...stylex.props(styles.metaLabel)}>ISBN</span>
          {isbn}
        </p>
        {readDate !== null && readDate.trim() !== "" && (
          <p {...stylex.props(styles.metaRow)}>
            <span {...stylex.props(styles.metaLabel)}>Read</span>
            <time dateTime={readDate}>{readDate.slice(0, 10)}</time>
          </p>
        )}
      </div>
    </header>
  );
}
