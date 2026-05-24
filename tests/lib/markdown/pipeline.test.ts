import { describe, expect, it } from "vitest";
import { collectNotes } from "@/lib/content/index.ts";
import { renderNotes } from "@/lib/markdown/index.ts";
import { BuildError } from "@/lib/content/errors.ts";
import { makeConfig } from "../../helpers/makeConfig.ts";

describe("renderNotes (integration)", () => {
  it("collectNotes → renderNotes でフィクスチャをすべてレンダリングできる", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));
    expect(rendered.length).toBe(items.length);
    expect(rendered.every((r) => typeof r.html === "string" && r.html.length > 0)).toBe(true);
  }, 30_000);

  it("link-source: outgoingLinks と html を確定する", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const source = rendered.find((r) => r.slug === "link-source");
    expect(source).toBeDefined();
    expect(source!.html).toContain('href="/notes/link-target"');
    expect(source!.outgoingLinks.map((o) => o.slug).toSorted()).toEqual([
      "link-target",
      "link-target",
      "link-target",
    ]);
    expect(source!.html).toContain("ghost-note");
    expect(source!.html).not.toContain('href="/notes/ghost-note"');
  }, 30_000);

  it("link-target にはバックリンクが付与される", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const target = rendered.find((r) => r.slug === "link-target");
    expect(target?.incomingLinks.length).toBe(1);
    expect(target?.incomingLinks[0]?.slug).toBe("link-source");
  }, 30_000);

  it("embed-host は embed-target の本文を展開する", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const host = rendered.find((r) => r.slug === "embed-host");
    expect(host?.html).toContain("これは埋め込まれる側");
    // grandchild embed becomes a link
    expect(host?.html).toContain('href="/notes/embed-grandchild"');
  }, 30_000);

  it("callouts が抽出される", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const cs = rendered.find((r) => r.slug === "callouts");
    const kinds = cs?.callouts.map((c) => c.kind);
    expect(kinds).toEqual(["note", "quote", "tip", "info", "warning", "note"]);
    expect(cs?.html).not.toContain("このメモは公開されない");
  }, 30_000);

  it("footnotes が抽出され、参照位置の paragraph 直後に block aside が挿入される", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const fs = rendered.find((r) => r.slug === "footnotes");
    expect(fs?.footnotes.length).toBe(2);
    expect(fs?.html).toContain('<aside class="footnote-aside"');
    expect(fs?.html).toContain('id="user-content-fn-aside-1"');
    expect(fs?.html).toContain("ひとつめの脚注");
    expect(fs?.html).toMatch(/data-side="(left|right)"/u);
  }, 30_000);

  it("toc は H2/H3 のみ", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const t = rendered.find((r) => r.slug === "toc");
    expect(t?.toc.map((e) => `${e.depth}:${e.text}`)).toEqual([
      "2:Section A",
      "2:Section B",
      "3:Subsection B1",
      "2:Section C",
    ]);
  }, 30_000);

  it("コードブロックは Shiki でハイライトされる", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const c = rendered.find((r) => r.slug === "code");
    expect(c?.html).toContain("shiki");
  }, 30_000);

  it("画像参照を images に集める", async () => {
    const items = await collectNotes(makeConfig("vault-markdown"));
    const rendered = await renderNotes(items, makeConfig("vault-markdown"));

    const i = rendered.find((r) => r.slug === "images");
    expect(i?.images.map((x) => x.rawPath).toSorted()).toEqual([
      "assets/embedded.png",
      "assets/picture.jpg",
    ]);
  }, 30_000);

  it("自己 Embed は BuildError", async () => {
    const items = await collectNotes(makeConfig("vault-markdown-self-embed"));
    await expect(
      renderNotes(items, makeConfig("vault-markdown-self-embed")),
    ).rejects.toBeInstanceOf(BuildError);
  }, 30_000);
});
