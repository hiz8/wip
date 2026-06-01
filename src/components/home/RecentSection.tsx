import * as stylex from "@stylexjs/stylex";
import { ContentTypeIcon } from "@/components/common/ContentTypeIcon.tsx";
import type { HomeRecentItem } from "@/server/home.ts";
import { colors, space, typography } from "@/styles/tokens.stylex.ts";
import { ContentLink } from "./ContentLink.tsx";

interface RecentSectionProps {
  items: readonly HomeRecentItem[];
}

const styles = stylex.create({
  list: {
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  item: {
    display: "flex",
    alignItems: "baseline",
    gap: space.s2,
  },
  icon: {
    flexShrink: 0,
    alignSelf: "center",
    color: colors.textMuted,
    lineHeight: 0,
  },
  body: {
    minWidth: 0,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    gap: space.s2,
  },
  date: {
    flexShrink: 0,
    fontSize: typography.fontSizeXs,
    color: colors.textMuted,
  },
});

// 最近更新されたコンテンツ (Notes/Glossary/Books 横断、updated 降順)。
export function RecentSection({ items }: RecentSectionProps) {
  return (
    // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- list-style:none で失われる list ロールを VoiceOver 向けに明示
    <ul {...stylex.props(styles.list)} role="list">
      {items.map((item) => (
        <li key={`${item.type}:${item.slug}`} {...stylex.props(styles.item)}>
          <span {...stylex.props(styles.icon)} aria-hidden="true">
            <ContentTypeIcon type={item.type} size={16} />
          </span>
          <span {...stylex.props(styles.body)}>
            <ContentLink type={item.type} slug={item.slug}>
              {item.title}
            </ContentLink>
            <time dateTime={item.updated} {...stylex.props(styles.date)}>
              {item.updated.slice(0, 10)}
            </time>
          </span>
        </li>
      ))}
    </ul>
  );
}
