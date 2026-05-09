import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { unified } from "unified";
import type { Root } from "mdast";
import { applyImage } from "@/lib/markdown/plugins/image.ts";
import type { ImageRef } from "@/types/content.ts";

function parse(md: string): Root {
  return unified().use(remarkParse).use(remarkGfm).parse(md) as Root;
}

describe("applyImage", () => {
  const vaultRoot = "/vault";
  const fromAbsolutePath = "/vault/notes/source.md";

  it("通常の image ノードを収集する", () => {
    const tree = parse("![alt](assets/pic.jpg)");
    const images: ImageRef[] = [];
    applyImage(tree, { fromAbsolutePath, vaultRoot, images });
    expect(images.length).toBe(1);
    expect(images[0]?.rawPath).toBe("assets/pic.jpg");
    expect(images[0]?.resolvedAbsolutePath).toBe(resolve("/vault/notes", "assets/pic.jpg"));
  });

  it("![[image.png]] を image ノードに変換して収集する", () => {
    const tree = parse("![[assets/embedded.png|代替]]");
    const images: ImageRef[] = [];
    applyImage(tree, { fromAbsolutePath, vaultRoot, images });
    expect(images.length).toBe(1);
    expect(images[0]?.rawPath).toBe("assets/embedded.png");
  });

  it("画像以外の ![[X]] には触れない", () => {
    const tree = parse("![[note]]");
    const images: ImageRef[] = [];
    applyImage(tree, { fromAbsolutePath, vaultRoot, images });
    expect(images.length).toBe(0);
  });

  it("Vault ルート起点の絶対パス (/foo) は vaultRoot からの相対で resolve", () => {
    const tree = parse("![](/abs/picture.png)");
    const images: ImageRef[] = [];
    applyImage(tree, { fromAbsolutePath, vaultRoot, images });
    expect(images[0]?.resolvedAbsolutePath).toBe(resolve(vaultRoot, "abs/picture.png"));
  });

  it("外部 URL はそのまま保持", () => {
    const tree = parse("![](https://example.com/x.png)");
    const images: ImageRef[] = [];
    applyImage(tree, { fromAbsolutePath, vaultRoot, images });
    expect(images[0]?.resolvedAbsolutePath).toBe("https://example.com/x.png");
  });
});
