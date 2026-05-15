import { describe, expect, it } from "vitest";
import { rewriteImgSrcInHtml } from "@/lib/images/rewrite.ts";

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
});
