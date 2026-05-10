import * as stylex from "@stylexjs/stylex";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell.tsx";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/config/static.ts";

const styles = stylex.create({
  hero: {
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
    maxWidth: "44rem",
    marginInline: "auto",
    paddingBlock: space.s7,
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
  cta: {
    color: colors.link,
    textDecoration: { default: "none", ":hover": "underline" },
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: SITE_NAME }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <AppShell variant="home">
      <section {...stylex.props(styles.hero)}>
        <h1 {...stylex.props(styles.heading)}>{SITE_NAME}</h1>
        <p {...stylex.props(styles.intro)}>{SITE_DESCRIPTION}</p>
        <p>
          <Link to="/notes" {...stylex.props(styles.cta)}>
            Browse notes →
          </Link>
        </p>
      </section>
    </AppShell>
  );
}
