// hiz.blue の /works ページから移植した静的プロジェクト一覧。Obsidian Vault を
// 情報源とせず、このリポジトリ内で完結する。表示順 (降順) で直書きし、runtime の
// ソートは行わない。
export interface Work {
  title: string;
  description: string;
  image?: string;
  urls: { type: "website" | "github"; url: string }[];
}

export const WORKS: Work[] = [
  {
    title: "Cinemasaurus",
    description: "沖縄県内の映画情報サイト",
    image: "/images/icon-cinemasaurus.svg",
    urls: [{ type: "website", url: "https://cinemasaurus.net/" }],
  },
  {
    title: "Giji one",
    description: "A tool for the assistance of people in the creation of meeting minutes.",
    image: "/images/icon-gijione.svg",
    urls: [
      { type: "website", url: "https://gijione.hizapp.blue/" },
      { type: "github", url: "https://github.com/hiz8/giji-one" },
    ],
  },
  {
    title: "airbeat",
    description: "Offline first metronome application.",
    image: "/images/icon-airbeat.svg",
    urls: [
      { type: "website", url: "https://airbeat.hizapp.blue/" },
      { type: "github", url: "https://github.com/hiz8/airbeat" },
    ],
  },
  {
    title: "Noto Serif CJK JP min",
    description: "Subset of the Noto Serif CJK JP for the size down.",
    urls: [
      { type: "website", url: "https://hiz8.github.io/Noto-Serif-CJK-JP.min/" },
      { type: "github", url: "https://github.com/hiz8/Noto-Serif-CJK-JP.min" },
    ],
  },
  {
    title: "Noto Sans CJK JP min",
    description: "Subset of the Noto Sans CJK JP for the size down.",
    urls: [
      { type: "website", url: "https://hiz8.github.io/Noto-Sans-CJK-JP.min/" },
      { type: "github", url: "https://github.com/hiz8/Noto-Sans-CJK-JP.min" },
    ],
  },
  {
    title: "VS Code Ruby Blue Theme",
    description: "Dark, high contrast theme for VS Code.",
    image: "/images/icon-ruby-blue-theme.png",
    urls: [
      {
        type: "website",
        url: "https://marketplace.visualstudio.com/items?itemName=hirofumii.rubyblue-theme",
      },
      { type: "github", url: "https://github.com/hiz8/vscode-theme-rubyblue" },
    ],
  },
];

export const ARCHIVED: Work[] = [
  {
    title: "Spectacle Boilerplate SWC",
    description: "Spectacle Boilerplate based on SWC for high speed.",
    urls: [
      {
        type: "website",
        url: "https://hiz8.github.io/spectacle-presentation-swc/",
      },
      {
        type: "github",
        url: "https://github.com/hiz8/spectacle-presentation-swc",
      },
    ],
  },
  {
    title: "hexo-theme-amp",
    description: "A simple and mobile first Hexo template on AMP ⚡ HTML.",
    urls: [
      { type: "website", url: "https://hiz8.github.io/hexo-theme-amp/" },
      { type: "github", url: "https://github.com/hiz8/hexo-theme-amp" },
    ],
  },
  {
    title: "Playground",
    description: "Playground for Future of Web Technology.",
    urls: [
      { type: "website", url: "https://ground.plyrs.net/" },
      { type: "github", url: "https://github.com/plyrs/plyground" },
    ],
  },
  {
    title: "Playlog",
    description: "Webフロントエンドについて徒然と",
    urls: [
      { type: "website", url: "https://log.plyrs.net/" },
      { type: "github", url: "https://github.com/plyrs/plylog" },
    ],
  },
  {
    title: "宜野湾 HUMAN STAGE",
    description: "宜野湾 HUMAN STAGE の公式ウェブサイト",
    urls: [{ type: "website", url: "https://www.humanstage.net/" }],
  },
  {
    title: "NAUTILUS OFFICIAL WEBSITE",
    description: "NAUTILUS の公式ウェブサイト",
    urls: [{ type: "website", url: "https://nautilus-jp.com/" }],
  },
];
