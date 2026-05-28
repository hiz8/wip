import * as stylex from "@stylexjs/stylex";
import type { BacklinkRef, TocEntry } from "@/types/content.ts";
import { space } from "@/styles/tokens.stylex.ts";
import { Toc } from "@/components/content/Toc.tsx";
import { Backlinks } from "@/components/common/Backlinks.tsx";

interface RightSidebarProps {
  toc: readonly TocEntry[];
  backlinks: readonly BacklinkRef[];
}

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
    // Stretch to the full <aside> height so the sticky <nav> inside <Toc> has
    // a containing block that spans the article body. Without this, the
    // flex column shrinks to its children's natural height and sticky drops
    // out mid-article.
    height: "100%",
  },
});

export function RightSidebar({ toc, backlinks }: RightSidebarProps) {
  if (toc.length === 0 && backlinks.length === 0) return null;
  return (
    <div {...stylex.props(styles.root)}>
      <Toc entries={toc} />
      <Backlinks links={backlinks} />
    </div>
  );
}
