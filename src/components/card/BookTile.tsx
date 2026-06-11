import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import { colors, shadow, space, typography } from "@/styles/tokens.stylex.ts";

interface BookTileProps {
  slug: string;
  title: string;
  authors: readonly string[];
  readDate: string | null;
  coverUrl: string | null;
}

const styles = stylex.create({
  tile: {
    display: "flex",
    flexDirection: "column",
    textDecoration: "none",
    color: colors.textPrimary,
  },
  // 書影。本の背を模した角丸 (背側 2px / 小口側 4px) + 浮き上がり hover。
  cover: {
    position: "relative",
    aspectRatio: "2 / 3",
    borderStartStartRadius: "2px",
    borderEndStartRadius: "2px",
    borderStartEndRadius: "4px",
    borderEndEndRadius: "4px",
    boxShadow: shadow.book,
    overflow: "hidden",
    marginBottom: space.s3,
    transform: {
      default: "translateY(0)",
      [stylex.when.ancestor(":hover")]: "translateY(-4px)",
      [stylex.when.ancestor(":focus-visible")]: "translateY(-4px)",
    },
    transitionProperty: "transform",
    transitionDuration: "200ms",
  },
  coverImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  // 書影画像がない本のプレースホルダ。タイトルと著者を載せた擬似カバー
  // (配色は両テーマ共通の装飾なので raw 値)。
  coverPlaceholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    height: "100%",
    paddingBlock: space.s3,
    paddingInline: space.s3,
    textAlign: "center",
    backgroundImage: "linear-gradient(135deg, #2d3a5c 0%, #1a2138 100%)",
    color: "#F0F7D8",
    fontFamily: typography.fontBrand,
  },
  coverTitle: {
    fontSize: typography.fontSizeSm,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    marginBlock: "auto",
    wordBreak: "keep-all",
  },
  coverAuthor: {
    fontSize: typography.fontSizeXs,
    opacity: 0.8,
  },
  // 本の背の折り目 (参考デザインの ::before / ::after 相当)。
  spine: {
    position: "absolute",
    insetBlock: 0,
    insetInlineStart: 0,
    width: "4px",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderInlineEndWidth: 1,
    borderInlineEndStyle: "solid",
    borderInlineEndColor: "rgba(255, 255, 255, 0.08)",
  },
  title: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    marginBottom: space.s1,
  },
  author: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    marginBottom: space.s1,
  },
  date: {
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
    fontVariantNumeric: "tabular-nums",
  },
});

// defaultMarker はタイル全体を cover の when.ancestor(":hover") の観測対象にする。
const TILE_STYLE = [styles.tile, stylex.defaultMarker()];

// Books 一覧の書影タイル (書影 + タイトル + 著者 + 読了月)。タイル全体がリンク。
export function BookTile({ slug, title, authors, readDate, coverUrl }: BookTileProps) {
  const params = useMemo(() => ({ isbn: slug }), [slug]);
  return (
    <Link to="/books/$isbn" params={params} {...stylex.props(TILE_STYLE)}>
      <span {...stylex.props(styles.cover)}>
        {coverUrl === null ? (
          <span {...stylex.props(styles.coverPlaceholder)} aria-hidden="true">
            <span {...stylex.props(styles.coverTitle)}>{title}</span>
            {authors.length > 0 && (
              <span {...stylex.props(styles.coverAuthor)}>{authors.join(", ")}</span>
            )}
          </span>
        ) : (
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            {...stylex.props(styles.coverImage)}
          />
        )}
        <span {...stylex.props(styles.spine)} aria-hidden="true" />
      </span>
      <span {...stylex.props(styles.title)}>{title}</span>
      {authors.length > 0 && <span {...stylex.props(styles.author)}>{authors.join(", ")}</span>}
      {readDate !== null && (
        <time dateTime={readDate} {...stylex.props(styles.date)}>
          {readDate.slice(0, 7)}
        </time>
      )}
    </Link>
  );
}
