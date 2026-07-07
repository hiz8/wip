import * as stylex from "@stylexjs/stylex";
import { createFileRoute } from "@tanstack/react-router";
import { Icon } from "@/components/common/Icon.tsx";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { WorksCard } from "@/components/works/WorksCard.tsx";
import { ARCHIVED, WORKS } from "@/lib/works/data.ts";
import { makeTitle } from "@/lib/seo/title.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

const PAGE_DESCRIPTION = "これまで作ってきたプロダクトや公開物。";

const styles = stylex.create({
  wrap: {
    maxWidth: "46em",
  },
  heading: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSize3xl,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    letterSpacing: "-0.01em",
    marginBottom: space.s3,
  },
  sub: {
    fontFamily: typography.fontBrand,
    fontStyle: "italic",
    fontSize: typography.fontSizeMd,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
    maxWidth: "32em",
    marginBottom: space.s6,
  },
  section: {
    marginBottom: space.s7,
  },
  sectionHeading: {
    fontFamily: typography.fontBrand,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
    marginBottom: space.s4,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
});

export const Route = createFileRoute("/works/")({
  head: () => ({
    meta: [{ title: makeTitle("Works") }, { name: "description", content: PAGE_DESCRIPTION }],
  }),
  component: WorksPage,
});

function WorksPage() {
  return (
    <AppShell variant="list">
      <div {...stylex.props(styles.wrap)}>
        <h1 {...stylex.props(styles.heading)}>
          <Icon type="works" size={30} />
          Works
        </h1>
        <p {...stylex.props(styles.sub)}>{PAGE_DESCRIPTION}</p>

        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionHeading)}>Works</h2>
          {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示 */}
          <ul {...stylex.props(styles.list)} role="list">
            {WORKS.map((work) => (
              <li key={work.title}>
                <WorksCard {...work} />
              </li>
            ))}
          </ul>
        </section>

        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionHeading)}>Legacy / Archived</h2>
          {/* oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示 */}
          <ul {...stylex.props(styles.list)} role="list">
            {ARCHIVED.map((work) => (
              <li key={work.title}>
                <WorksCard {...work} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
