import { useMemo } from "react";
import * as stylex from "@stylexjs/stylex";
import { Link } from "@tanstack/react-router";
import type { BacklinkRef } from "@/types/content.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";

interface BacklinksProps {
  links: readonly BacklinkRef[];
}

const styles = stylex.create({
  section: {
    fontSize: typography.fontSizeSm,
  },
  heading: {
    fontSize: typography.fontSizeXs,
    fontWeight: typography.weightSemibold,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: colors.textMuted,
    marginBottom: space.s2,
  },
  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  link: {
    color: colors.link,
    textDecoration: { default: "none", ":hover": "underline" },
  },
});

function NoteBacklink({ slug, title }: { slug: string; title: string }) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <Link to="/notes/$slug" params={params} {...stylex.props(styles.link)}>
      {title}
    </Link>
  );
}

export function Backlinks({ links }: BacklinksProps) {
  if (links.length === 0) return null;
  return (
    <section {...stylex.props(styles.section)} aria-label="Backlinks">
      <h2 {...stylex.props(styles.heading)}>Backlinks</h2>
      <ul {...stylex.props(styles.list)}>
        {links.map((ref) => (
          <li key={`${ref.type}:${ref.slug}`}>
            {ref.type === "notes" ? (
              <NoteBacklink slug={ref.slug} title={ref.title} />
            ) : (
              <span>{ref.title}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
