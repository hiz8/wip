import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

type CrumbRootTo = "/notes" | "/glossary" | "/books";

interface BreadcrumbProps {
  /** 先頭セグメント。to を与えるとカテゴリトップへのリンクになる。 */
  root: { label: string; to?: CrumbRootTo };
  /** 中間セグメント (Notes のフォルダ名、Glossary のかな行など)。null は省略。 */
  middle?: string | null | undefined;
  current: string;
}

const styles = stylex.create({
  crumb: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: space.s2,
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginBottom: space.s5,
  },
  rootLink: {
    color: { default: colors.textMuted, ":hover": colors.link },
    textDecoration: { default: "none", ":hover": "underline" },
  },
  sep: {
    opacity: 0.5,
  },
  current: {
    color: colors.textPrimary,
  },
});

// パンくず (root / middle / current)。
export function Breadcrumb({ root, middle, current }: BreadcrumbProps) {
  return (
    <p {...stylex.props(styles.crumb)}>
      {root.to === undefined ? (
        <span>{root.label}</span>
      ) : (
        <Link to={root.to} {...stylex.props(styles.rootLink)}>
          {root.label}
        </Link>
      )}
      <span {...stylex.props(styles.sep)} aria-hidden="true">
        /
      </span>
      {middle !== undefined && middle !== null && middle !== "" && (
        <>
          <span>{middle}</span>
          <span {...stylex.props(styles.sep)} aria-hidden="true">
            /
          </span>
        </>
      )}
      <span {...stylex.props(styles.current)}>{current}</span>
    </p>
  );
}
