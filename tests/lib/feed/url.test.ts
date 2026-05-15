import { describe, expect, it } from "vitest";
import { escapeXml, joinSiteUrl } from "@/lib/feed/url.ts";

describe("joinSiteUrl", () => {
  it("returns the site root with a trailing slash for /", () => {
    expect(joinSiteUrl("https://example.com", "/")).toBe("https://example.com/");
    expect(joinSiteUrl("https://example.com/", "/")).toBe("https://example.com/");
  });

  it("preserves ascii path segments unchanged", () => {
    expect(joinSiteUrl("https://example.com", "/notes")).toBe("https://example.com/notes");
    expect(joinSiteUrl("https://example.com", "/notes/foo")).toBe("https://example.com/notes/foo");
  });

  it("encodes non-ascii path segments", () => {
    expect(joinSiteUrl("https://example.com", "/notes/日本語")).toBe(
      `https://example.com/notes/${encodeURIComponent("日本語")}`,
    );
  });

  it("accepts a path without a leading slash", () => {
    expect(joinSiteUrl("https://example.com", "feed.xml")).toBe("https://example.com/feed.xml");
  });
});

describe("escapeXml", () => {
  it("escapes the five reserved characters", () => {
    expect(escapeXml(`A & B < > " '`)).toBe("A &amp; B &lt; &gt; &quot; &apos;");
  });
});
