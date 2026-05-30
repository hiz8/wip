import * as stylex from "@stylexjs/stylex";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import type { HomeFeaturedItem } from "@/server/home.ts";
import { colors, radius, space } from "@/styles/tokens.stylex.ts";
import { ContentLink } from "./ContentLink.tsx";

interface FeaturedSectionProps {
  items: readonly HomeFeaturedItem[];
}

const styles = stylex.create({
  list: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: space.s4,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: space.s2,
    padding: space.s4,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: { default: colors.borderSubtle, ":hover": colors.borderStrong },
    borderRadius: radius.md,
    transitionProperty: "border-color",
    transitionDuration: "120ms",
  },
  icon: {
    flexShrink: 0,
    color: colors.textMuted,
    lineHeight: 0,
  },
});

// Featured / Pinned コンテンツ (frontmatter featured:true、updated 降順)。
export function FeaturedSection({ items }: FeaturedSectionProps) {
  return (
    <ul {...stylex.props(styles.list)} role="list">
      {items.map((item) => (
        <li key={`${item.type}:${item.slug}`} {...stylex.props(styles.item)}>
          <span {...stylex.props(styles.icon)} aria-hidden="true">
            <ContentTypeIcon type={item.type} size={18} />
          </span>
          <ContentLink type={item.type} slug={item.slug}>
            {item.title}
          </ContentLink>
        </li>
      ))}
    </ul>
  );
}
