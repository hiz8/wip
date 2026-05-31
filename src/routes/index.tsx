import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { ContentTypeEntries } from "@/components/home/ContentTypeEntries.tsx";
import { FeaturedSection } from "@/components/home/FeaturedSection.tsx";
import { HomeBanner } from "@/components/home/HomeBanner.tsx";
import { HomeSection } from "@/components/home/HomeSection.tsx";
import { MarkdownProse } from "@/components/home/MarkdownProse.tsx";
import { RecentSection } from "@/components/home/RecentSection.tsx";
import { SocialLinks } from "@/components/home/SocialLinks.tsx";
import { space } from "@/styles/tokens.stylex.ts";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/config/static.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { getHomePageData } from "@/server/home.ts";

// 同一ファイルのフラットな文字列 const (StyleX media-query order の制約。
// AppShell.tsx 冒頭コメント参照)。
const BP_HOME_MID = "@media (min-width: 768px)";
const BP_HOME = "@media (min-width: 1100px)";

const styles = stylex.create({
  // バナー列 + 本文列。狭い画面ではバナーが上部の帯になり本文が下に積まれる。
  grid: {
    display: "grid",
    minHeight: "100vh",
    gridTemplateColumns: {
      default: "1fr",
      [BP_HOME_MID]: "240px minmax(0, 1fr)",
      [BP_HOME]: "320px minmax(0, 1fr)",
    },
    gridTemplateAreas: {
      default: '"banner" "content"',
      [BP_HOME_MID]: '"banner content"',
    },
  },
  content: {
    gridRowStart: "content",
    gridRowEnd: "content",
    gridColumnStart: "content",
    gridColumnEnd: "content",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: space.s7,
    maxWidth: "46rem",
    paddingInline: { default: space.s4, [BP_HOME_MID]: space.s6 },
    paddingBlock: space.s7,
  },
});

export const Route = createFileRoute("/")({
  loader: () => getHomePageData(),
  head: () => ({
    meta: [{ title: makeTitle(SITE_NAME) }],
  }),
  component: HomePage,
});

function HomePage() {
  const data = Route.useLoaderData();
  return (
    <AppShell variant="home">
      <div {...stylex.props(styles.grid)}>
        <HomeBanner title={SITE_NAME} tagline={SITE_DESCRIPTION} authorName={data.authorName} />

        <div {...stylex.props(styles.content)}>
          {data.introHtml !== null && <MarkdownProse html={data.introHtml} />}

          {data.aboutHtml !== null && (
            <HomeSection title="このサイトについて">
              <MarkdownProse html={data.aboutHtml} />
            </HomeSection>
          )}

          {data.recent.length > 0 && (
            <HomeSection title="最近更新">
              <RecentSection items={data.recent} />
            </HomeSection>
          )}

          <HomeSection title="コンテンツ">
            <ContentTypeEntries counts={data.counts} />
          </HomeSection>

          {data.featured.length > 0 && (
            <HomeSection title="Featured">
              <FeaturedSection items={data.featured} />
            </HomeSection>
          )}

          {data.socialLinks.length > 0 && (
            <HomeSection title="リンク">
              <SocialLinks links={data.socialLinks} />
            </HomeSection>
          )}
        </div>
      </div>
    </AppShell>
  );
}
