import { describe, expect, it } from "vitest";
import { rewriteImgSrcInHtml, rewriteItemHtml } from "@/lib/images/rewrite.ts";

describe("rewriteImgSrcInHtml", () => {
  it("returns html unchanged when the mapping is empty", () => {
    const html = '<p><img src="foo.png" alt=""></p>';
    expect(rewriteImgSrcInHtml(html, new Map())).toBe(html);
  });

  it("rewrites a matching src to its public path", () => {
    const html = '<p><img src="assets/foo.png" alt=""></p>';
    const map = new Map([["assets/foo.png", "/images/foo.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe('<p><img src="/images/foo.png" alt=""></p>');
  });

  it("preserves single-quoted src", () => {
    const html = "<p><img src='assets/foo.png' alt=''></p>";
    const map = new Map([["assets/foo.png", "/images/foo.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe("<p><img src='/images/foo.png' alt=''></p>");
  });

  it("leaves unmatched src values unchanged", () => {
    const html = '<p><img src="not-in-map.png" alt=""></p>';
    const map = new Map([["other.png", "/images/other.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe(html);
  });

  it("rewrites multiple images independently", () => {
    const html = '<img src="a.png"><img src="b.png"><img src="c.png">';
    const map = new Map([
      ["a.png", "/images/a.png"],
      ["c.png", "/images/c-1234abcd.png"],
    ]);
    expect(rewriteImgSrcInHtml(html, map)).toBe(
      '<img src="/images/a.png"><img src="b.png"><img src="/images/c-1234abcd.png">',
    );
  });

  it("rewrites the same rawPath that appears more than once", () => {
    const html = '<img src="diagram.png"><img src="diagram.png">';
    const map = new Map([["diagram.png", "/images/diagram.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe(
      '<img src="/images/diagram.png"><img src="/images/diagram.png">',
    );
  });

  it("keeps surrounding attributes including alt", () => {
    const html = '<img loading="lazy" src="foo.png" alt="A foo image" width="320">';
    const map = new Map([["foo.png", "/images/foo.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe(
      '<img loading="lazy" src="/images/foo.png" alt="A foo image" width="320">',
    );
  });

  it("does not rewrite external URLs that are absent from the map", () => {
    const html = '<img src="https://example.com/a.png">';
    const map = new Map([["a.png", "/images/a.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe(html);
  });

  it("matches a URL-encoded src against the decoded rawPath key", () => {
    const html = '<img src="4%20quadrant%20design.png" alt="">';
    const map = new Map([["4 quadrant design.png", "/images/4 quadrant design.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe('<img src="/images/4 quadrant design.png" alt="">');
  });

  it("matches an entity-escaped src against a rawPath key containing &", () => {
    const html = '<img src="Q&amp;A note.png" alt="">';
    const map = new Map([["Q&A note.png", "/images/Q&A note.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe('<img src="/images/Q&A note.png" alt="">');
  });

  it("matches a src that is both entity-escaped and percent-encoded", () => {
    const html = '<img src="Q&amp;A%20note.png" alt="">';
    const map = new Map([["Q&A note.png", "/images/Q&A note.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe('<img src="/images/Q&A note.png" alt="">');
  });

  it("matches a numeric character reference against the decoded rawPath key", () => {
    const html = '<img src="a&#38;b.png" alt="">';
    const map = new Map([["a&b.png", "/images/a&b.png"]]);
    expect(rewriteImgSrcInHtml(html, map)).toBe('<img src="/images/a&b.png" alt="">');
  });
});

describe("rewriteItemHtml", () => {
  it("rewrites rawPath src to publicPath using the resolved map", () => {
    const html = '<p><img src="assets/foo.png" alt=""></p>';
    const images = [{ rawPath: "assets/foo.png", resolvedAbsolutePath: "/vault/assets/foo.png" }];
    const resolvedToPublic = new Map([["/vault/assets/foo.png", "/images/foo.png"]]);
    expect(rewriteItemHtml(html, images, resolvedToPublic)).toBe(
      '<p><img src="/images/foo.png" alt=""></p>',
    );
  });

  it("skips external images and leaves them unchanged", () => {
    const html = '<img src="https://example.com/a.png">';
    const images = [
      { rawPath: "https://example.com/a.png", resolvedAbsolutePath: "https://example.com/a.png" },
    ];
    const resolvedToPublic = new Map<string, string>();
    expect(rewriteItemHtml(html, images, resolvedToPublic)).toBe(html);
  });

  it("returns html unchanged when no image resolves to a public path", () => {
    const html = '<p><img src="missing.png"></p>';
    const images = [{ rawPath: "missing.png", resolvedAbsolutePath: "/vault/missing.png" }];
    const resolvedToPublic = new Map([["/vault/other.png", "/images/other.png"]]);
    expect(rewriteItemHtml(html, images, resolvedToPublic)).toBe(html);
  });

  it("maps a hashed publicPath for basename collisions", () => {
    const html = '<img src="a/diagram.png"><img src="b/diagram.png">';
    const images = [
      { rawPath: "a/diagram.png", resolvedAbsolutePath: "/vault/a/diagram.png" },
      { rawPath: "b/diagram.png", resolvedAbsolutePath: "/vault/b/diagram.png" },
    ];
    const resolvedToPublic = new Map([
      ["/vault/a/diagram.png", "/images/diagram-11111111.png"],
      ["/vault/b/diagram.png", "/images/diagram-22222222.png"],
    ]);
    expect(rewriteItemHtml(html, images, resolvedToPublic)).toBe(
      '<img src="/images/diagram-11111111.png"><img src="/images/diagram-22222222.png">',
    );
  });
});
