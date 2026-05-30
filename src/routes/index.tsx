import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { ContentTypeEntries } from "@/components/home/ContentTypeEntries.tsx";
import { FeaturedSection } from "@/components/home/FeaturedSection.tsx";
import { HomeSection } from "@/components/home/HomeSection.tsx";
import { MarkdownProse } from "@/components/home/MarkdownProse.tsx";
import { RecentSection } from "@/components/home/RecentSection.tsx";
import { SocialLinks } from "@/components/home/SocialLinks.tsx";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/config/static.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { getHomePageData } from "@/server/home.ts";

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s7,
    maxWidth: "44rem",
    marginInline: "auto",
    paddingBlock: space.s7,
  },
  hero: {
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
  },
  heading: {
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightBold,
    lineHeight: typography.lineHeightTight,
    color: colors.textPrimary,
  },
  intro: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeMd,
    lineHeight: typography.lineHeightRelaxed,
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
      <div {...stylex.props(styles.page)}>
        <section {...stylex.props(styles.hero)}>
          <h1 {...stylex.props(styles.heading)}>{SITE_NAME}</h1>
          <p {...stylex.props(styles.intro)}>{SITE_DESCRIPTION}</p>
        </section>

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
    </AppShell>
  );
}
