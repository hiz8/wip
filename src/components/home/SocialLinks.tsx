import * as stylex from "@stylexjs/stylex";
import type { HomeSocialLink } from "@/server/home.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

interface SocialLinksProps {
  links: readonly HomeSocialLink[];
}

const styles = stylex.create({
  list: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s3,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    paddingBlock: space.s2,
    paddingInline: space.s3,
    fontSize: typography.fontSizeSm,
    color: colors.link,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.borderSubtle, ":hover": colors.borderStrong },
    borderRadius: radius.pill,
    textDecoration: { default: "none", ":hover": "underline" },
  },
});

// 外部リンク (site.config.ts の author.socialLinks)。
export function SocialLinks({ links }: SocialLinksProps) {
  return (
    <ul {...stylex.props(styles.list)} role="list">
      {links.map((link) => (
        <li key={link.url}>
          <a href={link.url} target="_blank" rel="noreferrer" {...stylex.props(styles.link)}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
