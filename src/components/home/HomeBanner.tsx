import * as stylex from "@stylexjs/stylex";
import { space, typography } from "@/styles/tokens.stylex.ts";

interface HomeBannerProps {
  title: string;
  tagline: string;
  authorName: string;
}

// バナーの色はブランド固定 (テーマ非依存)。navy テキストをスカイグラデーション上に置く。
const BANNER_TEXT = "#1C274C";
const BANNER_TAGLINE = "rgba(28, 39, 76, 0.78)";
const BANNER_FOOT = "rgba(28, 39, 76, 0.6)";
const BANNER_FOOT_RULE = "rgba(28, 39, 76, 0.15)";

// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約)。
const BP_HOME_MID = "@media (min-width: 768px)";
const BP_HOME = "@media (min-width: 1100px)";

const styles = stylex.create({
  banner: {
    gridRowStart: "banner",
    gridRowEnd: "banner",
    gridColumnStart: "banner",
    gridColumnEnd: "banner",
    // default の relative は sun glow (absolute) のアンカー兼ねる。広い画面では
    // sticky な全高グラデーション列、狭い画面では上部の帯になる。
    position: { default: "relative", [BP_HOME_MID]: "sticky" },
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    backgroundImage: "var(--banner-gradient)",
    color: BANNER_TEXT,
    boxSizing: "border-box",
    paddingInline: { default: space.s5, [BP_HOME]: space.s6 },
    paddingBlock: { default: space.s6, [BP_HOME]: space.s7 },
    top: { default: "auto", [BP_HOME_MID]: 0 },
    alignSelf: { default: "stretch", [BP_HOME_MID]: "start" },
    height: { default: "auto", [BP_HOME_MID]: "100vh" },
  },
  sun: {
    position: "absolute",
    top: "-2.5rem",
    insetInlineEnd: "-3.125rem",
    width: "14.375rem",
    height: "14.375rem",
    borderRadius: "50%",
    backgroundImage:
      "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 38%, rgba(255,255,255,0) 70%)",
    pointerEvents: "none",
  },
  head: {
    position: "relative",
    zIndex: 1,
    marginBlockStart: { default: 0, [BP_HOME_MID]: "auto" },
    marginBlockEnd: space.s6,
  },
  title: {
    fontFamily: typography.fontBrand,
    fontSize: { default: typography.fontSize2xl, [BP_HOME]: typography.fontSize4xl },
    fontWeight: typography.weightMedium,
    lineHeight: 1.04,
    letterSpacing: "-0.02em",
    margin: 0,
    marginBlockEnd: space.s4,
    color: BANNER_TEXT,
  },
  tagline: {
    fontFamily: typography.fontSans,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightRelaxed,
    margin: 0,
    color: BANNER_TAGLINE,
    maxWidth: "16em",
  },
  foot: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    fontFamily: typography.fontSans,
    fontSize: typography.fontSizeXs,
    letterSpacing: "0.02em",
    color: BANNER_FOOT,
    paddingBlockStart: space.s3,
    borderBlockStartWidth: "1px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: BANNER_FOOT_RULE,
  },
});

// hiz.blue 風のスカイバナー列。ナビとメインコンテンツの間に置く全高グラデーション。
export function HomeBanner({ title, tagline, authorName }: HomeBannerProps) {
  return (
    <div {...stylex.props(styles.banner)}>
      <div aria-hidden="true" {...stylex.props(styles.sun)} />
      <div {...stylex.props(styles.head)}>
        <h1 {...stylex.props(styles.title)}>{title}</h1>
        <p {...stylex.props(styles.tagline)}>{tagline}</p>
      </div>
      <div {...stylex.props(styles.foot)}>
        <span>{authorName}</span>
        <span>Digital Garden</span>
      </div>
    </div>
  );
}
