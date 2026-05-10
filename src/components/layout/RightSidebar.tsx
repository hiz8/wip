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
    position: "sticky",
    top: space.s5,
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
