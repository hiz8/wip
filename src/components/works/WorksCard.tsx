import * as stylex from "@stylexjs/stylex";
import type { IconType } from "@/components/common/Icon.tsx";
import { Icon } from "@/components/common/Icon.tsx";
import type { Work } from "@/lib/works/data.ts";
import { colors, radius, space, typography } from "@/styles/tokens.stylex.ts";

const IMAGE_SIZE = 44;

// url.type から表示アイコンとアクセシブルネームを引くマップ。
const URL_META = {
  website: { icon: "global", label: "Website" },
  github: { icon: "github", label: "GitHub" },
} satisfies Record<Work["urls"][number]["type"], { icon: IconType; label: string }>;

const styles = stylex.create({
  root: {
    display: "flex",
    gap: space.s3,
  },
  imageWrapper: {
    flexShrink: 0,
    width: `${IMAGE_SIZE}px`,
    height: `${IMAGE_SIZE}px`,
    borderRadius: radius.md,
    overflow: "hidden",
    boxSizing: "border-box",
  },
  imageWrapperEmpty: {
    backgroundColor: colors.bgElevated,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: space.s1,
  },
  title: {
    fontSize: typography.fontSizeMd,
    fontWeight: typography.weightMedium,
    lineHeight: typography.lineHeightTight,
  },
  description: {
    fontSize: typography.fontSizeSm,
    color: colors.textMuted,
    lineHeight: typography.lineHeightNormal,
  },
  urls: {
    display: "flex",
    gap: space.s3,
    marginBlockStart: space.s1,
  },
  urlLink: {
    display: "inline-flex",
    lineHeight: 0,
    color: { default: colors.textSecondary, ":hover": colors.link },
  },
});

export function WorksCard({ title, description, image, urls }: Work) {
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.imageWrapper, image === undefined && styles.imageWrapperEmpty)}>
        {image !== undefined && (
          <img
            src={image}
            alt={title}
            width={IMAGE_SIZE}
            height={IMAGE_SIZE}
            {...stylex.props(styles.image)}
          />
        )}
      </div>
      <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.title)}>{title}</div>
        <div {...stylex.props(styles.description)}>{description}</div>
        {urls.length > 0 && (
          <div {...stylex.props(styles.urls)}>
            {urls.map(({ type, url }) => {
              const meta = URL_META[type];
              return (
                <a
                  key={`${type}-${url}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={meta.label}
                  {...stylex.props(styles.urlLink)}
                >
                  <Icon type={meta.icon} size={18} />
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
