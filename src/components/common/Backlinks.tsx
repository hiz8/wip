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

function GlossaryBacklink({ slug, title }: { slug: string; title: string }) {
  const params = useMemo(() => ({ slug }), [slug]);
  return (
    <Link to="/glossary/$slug" params={params} {...stylex.props(styles.link)}>
      {title}
    </Link>
  );
}

function BookBacklink({ slug, title }: { slug: string; title: string }) {
  const params = useMemo(() => ({ isbn: slug }), [slug]);
  return (
    <Link to="/books/$isbn" params={params} {...stylex.props(styles.link)}>
      {title}
    </Link>
  );
}

function BacklinkBody({ ref }: { ref: BacklinkRef }) {
  if (ref.type === "notes") return <NoteBacklink slug={ref.slug} title={ref.title} />;
  if (ref.type === "glossary") return <GlossaryBacklink slug={ref.slug} title={ref.title} />;
  if (ref.type === "books") return <BookBacklink slug={ref.slug} title={ref.title} />;
  return <span>{ref.title}</span>;
}

export function Backlinks({ links }: BacklinksProps) {
  if (links.length === 0) return null;
  return (
    <section {...stylex.props(styles.section)} aria-label="Backlinks">
      <h2 {...stylex.props(styles.heading)}>Backlinks</h2>
      <ul {...stylex.props(styles.list)}>
        {links.map((ref) => (
          <li key={`${ref.type}:${ref.slug}`}>
            <BacklinkBody ref={ref} />
          </li>
        ))}
      </ul>
    </section>
  );
}
