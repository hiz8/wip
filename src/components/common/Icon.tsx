import * as stylex from "@stylexjs/stylex";

export type IconType = "home" | "github" | "global" | "works" | "blog" | "externalLink";

// SVG は参考リポジトリ hiz8/hiz.blue-ui の icon/assets/encodedSvgs.ts から該当 6 キーを流用。
// CSS mask として使うため色値 (fill/stroke) は無視され、background-color の currentColor で着色する。
//
// data URI は url() 込みの完成形を同一ファイルのフラット const に置く。custom moduleResolution 下では
// ファイルまたぎの const が var(--hash) 化され mask-image: url(var(--hash)) は機能しないため、
// AppShell.tsx の BP_TABLET と同じく同一ファイルの単一識別子 const で静的 inline 化させる。
const HOME_MASK =
  "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIuNjY2NzUgMTYuMjcxOUMyLjY2Njc1IDEzLjIyMDcgMi42NjY3NSAxMS42OTUgMy4zNTkwMiAxMC40MzAzQzQuMDUxMjggOS4xNjU2MSA1LjMxNjAxIDguMzgwNjkgNy44NDU0NiA2LjgxMDg0TDEwLjUxMjEgNS4xNTU4M0MxMy4xODU5IDMuNDk2MzkgMTQuNTIyOCAyLjY2NjY3IDE2LjAwMDEgMi42NjY2N0MxNy40NzczIDIuNjY2NjcgMTguODE0MiAzLjQ5NjM5IDIxLjQ4OCA1LjE1NTgzTDI0LjE1NDcgNi44MTA4NEMyNi42ODQyIDguMzgwNjkgMjcuOTQ4OSA5LjE2NTYxIDI4LjY0MTEgMTAuNDMwM0MyOS4zMzM0IDExLjY5NSAyOS4zMzM0IDEzLjIyMDcgMjkuMzMzNCAxNi4yNzE5VjE4LjI5OTlDMjkuMzMzNCAyMy41MDExIDI5LjMzMzQgMjYuMTAxNyAyNy43NzEzIDI3LjcxNzVDMjYuMjA5MiAyOS4zMzMzIDIzLjY5NTEgMjkuMzMzMyAxOC42NjY3IDI5LjMzMzNIMTMuMzMzNEM4LjMwNTEgMjkuMzMzMyA1Ljc5MDk0IDI5LjMzMzMgNC4yMjg4NSAyNy43MTc1QzIuNjY2NzUgMjYuMTAxNyAyLjY2Njc1IDIzLjUwMTEgMi42NjY3NSAxOC4yOTk5VjE2LjI3MTlaIiBzdHJva2U9IiMxQzI3NEMiIHN0cm9rZS13aWR0aD0iMS41Ii8+CjxwYXRoIGQ9Ik0yMCAyNEgxMiIgc3Ryb2tlPSIjMUMyNzRDIiBzdHJva2Utd2lkdGg9IjEuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPgo=)";
const GITHUB_MASK =
  "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSJjdXJyZW50Q29sb3IiIGQ9Ik0xMiAyQTEwIDEwIDAgMCAwIDIgMTJjMCA0LjQyIDIuODcgOC4xNyA2Ljg0IDkuNWMuNS4wOC42Ni0uMjMuNjYtLjV2LTEuNjljLTIuNzcuNi0zLjM2LTEuMzQtMy4zNi0xLjM0Yy0uNDYtMS4xNi0xLjExLTEuNDctMS4xMS0xLjQ3Yy0uOTEtLjYyLjA3LS42LjA3LS42YzEgLjA3IDEuNTMgMS4wMyAxLjUzIDEuMDNjLjg3IDEuNTIgMi4zNCAxLjA3IDIuOTEuODNjLjA5LS42NS4zNS0xLjA5LjYzLTEuMzRjLTIuMjItLjI1LTQuNTUtMS4xMS00LjU1LTQuOTJjMC0xLjExLjM4LTIgMS4wMy0yLjcxYy0uMS0uMjUtLjQ1LTEuMjkuMS0yLjY0YzAgMCAuODQtLjI3IDIuNzUgMS4wMmMuNzktLjIyIDEuNjUtLjMzIDIuNS0uMzNjLjg1IDAgMS43MS4xMSAyLjUuMzNjMS45MS0xLjI5IDIuNzUtMS4wMiAyLjc1LTEuMDJjLjU1IDEuMzUuMiAyLjM5LjEgMi42NGMuNjUuNzEgMS4wMyAxLjYgMS4wMyAyLjcxYzAgMy44Mi0yLjM0IDQuNjYtNC41NyA0LjkxYy4zNi4zMS42OS45Mi42OSAxLjg1VjIxYzAgLjI3LjE2LjU5LjY3LjVDMTkuMTQgMjAuMTYgMjIgMTYuNDIgMjIgMTJBMTAgMTAgMCAwIDAgMTIgMiIvPjwvc3ZnPg0K)";
const GLOBAL_MASK =
  "url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZyBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIxLjUiPjxwYXRoIGQ9Ik0yMiAxMmExMCAxMCAwIDEgMS0yMC4wMDEgMEExMCAxMCAwIDAgMSAyMiAxMloiLz48cGF0aCBkPSJNMTYgMTJjMCAxLjMxMy0uMTA0IDIuNjE0LS4zMDUgMy44MjdjLS4yIDEuMjEzLS40OTUgMi4zMTUtLjg2NyAzLjI0NGMtLjM3MS45MjktLjgxMiAxLjY2NS0xLjI5NyAyLjE2OGMtLjQ4Ni41MDItMS4wMDYuNzYxLTEuNTMxLjc2MWMtLjUyNSAwLTEuMDQ1LS4yNTktMS41My0uNzYxYy0uNDg2LS41MDMtLjkyNy0xLjI0LTEuMjk4LTIuMTY4Yy0uMzcyLS45MjktLjY2Ny0yLjAzLS44NjgtMy4yNDRBMjMuNjE0IDIzLjYxNCAwIDAgMSA4IDEyYzAtMS4zMTMuMTAzLTIuNjE0LjMwNC0zLjgyN3MuNDk2LTIuMzE1Ljg2OC0zLjI0NGMuMzcxLS45MjkuODEyLTEuNjY1IDEuMjk3LTIuMTY4QzEwLjk1NSAyLjI2IDExLjQ3NSAyIDEyIDJjLjUyNSAwIDEuMDQ1LjI1OSAxLjUzLjc2MWMuNDg2LjUwMy45MjcgMS4yNCAxLjI5OCAyLjE2OGMuMzcyLjkyOS42NjcgMi4wMy44NjcgMy4yNDRDMTUuODk2IDkuMzg2IDE2IDEwLjY4NyAxNiAxMloiLz48cGF0aCBzdHJva2UtbGluZWNhcD0icm91bmQiIGQ9Ik0yIDEyaDIwIi8+PC9nPjwvc3ZnPg0K)";
const WORKS_MASK =
  "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI2LjA4MjYgOS4zMzMzM0MyNi4zODc1IDcuNTkzNjQgMjUuMDQ4OCA2IDIzLjI4MjYgNkg4LjcxNzQ5QzYuOTUxMyA2IDUuNjEyNjIgNy41OTM2NCA1LjkxNzQ1IDkuMzMzMzMiIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHBhdGggZD0iTTIzLjMzMzIgNkMyMy4zNzExIDUuNjU0NTcgMjMuMzkgNS40ODE4IDIzLjM5MDMgNS4zMzkxM0MyMy4zOTMzIDMuOTc0MyAyMi4zNjUyIDIuODI3NTMgMjEuMDA4MiAyLjY4MTlDMjAuODY2MyAyLjY2NjY3IDIwLjY5MjYgMi42NjY2NyAyMC4zNDUgMi42NjY2N0gxMS42NTQ3QzExLjMwNzEgMi42NjY2NyAxMS4xMzM0IDIuNjY2NjcgMTAuOTkxNSAyLjY4MTlDOS42MzQ0NiAyLjgyNzUzIDguNjA2NDIgMy45NzQzIDguNjA5MzggNS4zMzkxM0M4LjYwOTY5IDUuNDgxODEgOC42Mjg2MSA1LjY1NDU0IDguNjY2NDQgNiIgc3Ryb2tlPSIjMUMyNzRDIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8cGF0aCBkPSJNMjAgMjRIMTIiIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMy4xNzgxIDE4LjM5MDZDMi41ODMzOSAxNC4xNzI2IDIuMjg2MDQgMTIuMDYzNSAzLjU0OTg0IDEwLjY5ODRDNC44MTM2NCA5LjMzMzMzIDcuMDYzNTIgOS4zMzMzMyAxMS41NjMzIDkuMzMzMzNIMjAuNDM2OUMyNC45MzY2IDkuMzMzMzMgMjcuMTg2NSA5LjMzMzMzIDI4LjQ1MDMgMTAuNjk4NEMyOS43MTQxIDEyLjA2MzUgMjkuNDE2OCAxNC4xNzI2IDI4LjgyMjEgMTguMzkwNkwyOC4yNTgxIDIyLjM5MDZDMjcuNzkxNyAyNS42OTg1IDI3LjU1ODYgMjcuMzUyNCAyNi4zNjIzIDI4LjM0MjlDMjUuMTY2IDI5LjMzMzMgMjMuNDAxNyAyOS4zMzMzIDE5Ljg3MjkgMjkuMzMzM0gxMi4xMjcyQzguNTk4NDkgMjkuMzMzMyA2LjgzNDEyIDI5LjMzMzMgNS42Mzc4NyAyOC4zNDI5QzQuNDQxNjEgMjcuMzUyNCA0LjIwODQzIDI1LjY5ODUgMy43NDIwNiAyMi4zOTA2TDMuMTc4MSAxOC4zOTA2WiIgc3Ryb2tlPSIjMUMyNzRDIiBzdHJva2Utd2lkdGg9IjEuNSIvPgo8L3N2Zz4K)";
const BLOG_MASK =
  "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMTZIMTIuMDAwMU0yMS4zMzM0IDE2SDE2LjAwMDEiIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjEuMzMzNCAxMC42NjY3SDIwLjAwMDFNMTYuMDAwMSAxMC42NjY3SDEwLjY2NjciIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNMTAuNjY2NyAyMS4zMzMzSDE3LjMzMzQiIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8cGF0aCBkPSJNNCAxOC42NjY3VjEzLjMzMzNDNCA4LjMwNTAyIDQgNS43OTA4NyA1LjU2MjEgNC4yMjg3N0M3LjEyNDIgMi42NjY2NyA5LjYzODM1IDIuNjY2NjcgMTQuNjY2NyAyLjY2NjY3SDE3LjMzMzNDMjIuMzYxNiAyLjY2NjY3IDI0Ljg3NTggMi42NjY2NyAyNi40Mzc5IDQuMjI4NzdDMjcuMzA4OCA1LjA5OTY4IDI3LjY5NDIgNi4yNjY1MiAyNy44NjQ3IDhNMjggMTMuMzMzM1YxOC42NjY3QzI4IDIzLjY5NSAyOCAyNi4yMDkxIDI2LjQzNzkgMjcuNzcxMkMyNC44NzU4IDI5LjMzMzMgMjIuMzYxNiAyOS4zMzMzIDE3LjMzMzMgMjkuMzMzM0gxNC42NjY3QzkuNjM4MzUgMjkuMzMzMyA3LjEyNDIgMjkuMzMzMyA1LjU2MjEgMjcuNzcxMkM0LjY5MTE5IDI2LjkwMDMgNC4zMDU4MyAyNS43MzM1IDQuMTM1MzIgMjQiIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K)";
const EXTERNAL_LINK_MASK =
  "url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE3LjMzMzMgMTQuNjY2N0wyOS4zMzMzIDIuNjY2NjZNMjkuMzMzMyAyLjY2NjY2SDIyLjIwODNNMjkuMzMzMyAyLjY2NjY2VjkuNzkxNjYiIHN0cm9rZT0iIzFDMjc0QyIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8cGF0aCBkPSJNMjkuMzMzNCAxNkMyOS4zMzM0IDIyLjI4NTQgMjkuMzMzNCAyNS40MjgxIDI3LjM4MDggMjcuMzgwN0MyNS40MjgyIDI5LjMzMzMgMjIuMjg1NSAyOS4zMzMzIDE2LjAwMDEgMjkuMzMzM0M5LjcxNDY5IDI5LjMzMzMgNi41NzE5OSAyOS4zMzMzIDQuNjE5MzcgMjcuMzgwN0MyLjY2Njc1IDI1LjQyODEgMi42NjY3NSAyMi4yODU0IDIuNjY2NzUgMTZDMi42NjY3NSA5LjcxNDYgMi42NjY3NSA2LjU3MTkgNC42MTkzNyA0LjYxOTI4QzYuNTcxOTkgMi42NjY2NiA5LjcxNDY5IDIuNjY2NjYgMTYuMDAwMSAyLjY2NjY2IiBzdHJva2U9IiMxQzI3NEMiIHN0cm9rZS13aWR0aD0iMS41Ii8+Cjwvc3ZnPgo=)";

const styles = stylex.create({
  // span 自身ではなく ::before に mask を当てる。span に直接当てると子要素ごとマスクされるため、
  // CSS mask 方式では ::before が必須 (stylex-authoring.md の「::before より実要素を優先」への意図的逸脱)。
  icon: {
    lineHeight: 0,
    display: "inline-block",
    "::before": {
      content: '""',
      display: "inline-block",
      width: "1em",
      height: "1em",
      backgroundColor: "currentColor",
      // mask-* は標準 longhand のみ記述する。-webkit- prefix は StyleX が自動付与し
      // (出力 CSS に -webkit-mask-image 等が入る)、手書きの -webkit-mask-* longhand は
      // @stylexjs/valid-styles に弾かれるため書かない。
      maskRepeat: "no-repeat",
      maskPosition: "center",
      maskSize: "contain",
    },
  },
  // size(px) は span の font-size に載せ、::before の 1em を駆動する。
  size: (px: number) => ({ fontSize: `${px}px` }),
  typeHome: { "::before": { maskImage: HOME_MASK } },
  typeGithub: { "::before": { maskImage: GITHUB_MASK } },
  typeGlobal: { "::before": { maskImage: GLOBAL_MASK } },
  typeWorks: { "::before": { maskImage: WORKS_MASK } },
  typeBlog: { "::before": { maskImage: BLOG_MASK } },
  typeExternalLink: { "::before": { maskImage: EXTERNAL_LINK_MASK } },
});

// vanilla-extract の styleVariants 代替。type から style を引くマップ (ContentTypeIcon の PATHS と同手法)。
const TYPE_STYLES = {
  home: styles.typeHome,
  github: styles.typeGithub,
  global: styles.typeGlobal,
  works: styles.typeWorks,
  blog: styles.typeBlog,
  externalLink: styles.typeExternalLink,
} satisfies Record<IconType, unknown>;

interface IconProps {
  type: IconType;
  size?: number;
  label?: string;
}

// label があれば role="img" + aria-label、なければ装飾として aria-hidden。
// role は JSX 属性に直接書かずオブジェクト経由で渡すため、jsx-a11y/prefer-tag-over-role は発火しない。
export function Icon({ type, size = 20, label }: IconProps) {
  const a11yProps = label
    ? { role: "img" as const, "aria-label": label }
    : { "aria-hidden": true as const };
  return (
    <span {...a11yProps} {...stylex.props(styles.icon, styles.size(size), TYPE_STYLES[type])} />
  );
}
