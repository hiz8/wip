import * as stylex from "@stylexjs/stylex";
import { space, typography } from "@/styles/tokens.stylex.ts";

interface HomeBannerProps {
  title: string;
  tagline: string;
}

// バナーのスカイ配色は brand-vars.css の --banner-* で管理し、light=昼空 / dark=夜空へ
// 切り替わる (グラデーション・テキスト)。ここでは var() 参照のみ持つ。

// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約)。
const BP_HOME_MID = "@media (min-width: 768px)";
const BP_HOME = "@media (min-width: 1100px)";

const styles = stylex.create({
  banner: {
    gridRowStart: "banner",
    gridRowEnd: "banner",
    gridColumnStart: "banner",
    gridColumnEnd: "banner",
    // 広い画面では sticky な全高グラデーション列、狭い画面では上部の帯になる。
    position: { default: "relative", [BP_HOME_MID]: "sticky" },
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    justifyContent: { default: "flex-start", [BP_HOME_MID]: "center" },
    backgroundImage: "var(--banner-gradient)",
    backgroundRepeat: "var(--banner-bg-repeat)",
    // 帯 (default) と縦列 (BP_HOME_MID 以上) で雲の最適位置が異なるため切り替える。
    backgroundPosition: {
      default: "var(--banner-bg-position)",
      [BP_HOME_MID]: "var(--banner-bg-position-wide)",
    },
    backgroundSize: "var(--banner-bg-size)",
    color: "var(--banner-text)",
    boxSizing: "border-box",
    paddingInline: { default: space.s5, [BP_HOME]: space.s6 },
    paddingBlock: { default: space.s6, [BP_HOME]: space.s7 },
    top: { default: "auto", [BP_HOME_MID]: 0 },
    alignSelf: { default: "stretch", [BP_HOME_MID]: "start" },
    height: { default: "auto", [BP_HOME_MID]: "100vh" },
  },
  head: {
    position: "relative",
    zIndex: 1,
  },
  title: {
    fontFamily: typography.fontBrand,
    fontSize: { default: typography.fontSize2xl, [BP_HOME]: typography.fontSize4xl },
    fontWeight: typography.weightMedium,
    lineHeight: 1.04,
    letterSpacing: "-0.02em",
    margin: 0,
    marginBlockEnd: space.s4,
    color: "var(--banner-text)",
  },
  tagline: {
    fontFamily: typography.fontSans,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightRelaxed,
    margin: 0,
    color: "var(--banner-tagline)",
    maxWidth: "16em",
  },
});

// hiz.blue 風のスカイバナー列。ナビとメインコンテンツの間に置く全高グラデーション。
export function HomeBanner({ title, tagline }: HomeBannerProps) {
  return (
    <div {...stylex.props(styles.banner)}>
      <div {...stylex.props(styles.head)}>
        <h1 {...stylex.props(styles.title)}>{title}</h1>
        <p {...stylex.props(styles.tagline)}>{tagline}</p>
      </div>
    </div>
  );
}
