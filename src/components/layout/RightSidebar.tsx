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
    // <aside> の高さいっぱいに広げることで、<Toc> 内の sticky な <nav> が記事
    // 本文にわたる containing block を持つようにする。これがないと flex 列は
    // 子要素の自然な高さに縮み、記事の途中で sticky が外れてしまう。
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
