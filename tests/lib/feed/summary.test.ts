import { describe, expect, it } from "vitest";
import { DEFAULT_SUMMARY_LENGTH, extractFeedSummary, stripHtmlTags } from "@/lib/feed/summary.ts";

describe("stripHtmlTags", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtmlTags("<p>Hello <strong>world</strong></p>")).toBe("Hello world");
  });

  it("collapses inserted spaces between adjacent tags", () => {
    expect(stripHtmlTags("<p>a</p><p>b</p>")).toBe("a b");
  });

  it("normalizes mixed whitespace", () => {
    expect(stripHtmlTags("foo\n\nbar\t baz")).toBe("foo bar baz");
  });

  it("returns an empty string for empty input", () => {
    expect(stripHtmlTags("")).toBe("");
    expect(stripHtmlTags("<p></p>")).toBe("");
  });
});

describe("extractFeedSummary", () => {
  it("prefers frontmatter.summary", () => {
    const summary = extractFeedSummary({
      frontmatter: { summary: "from frontmatter" },
      html: "<p>body</p>",
    });
    expect(summary).toBe("from frontmatter");
  });

  it("ignores blank frontmatter summary and falls back to body", () => {
    const summary = extractFeedSummary({
      frontmatter: { summary: "   " },
      html: "<p>actual body text</p>",
    });
    expect(summary).toBe("actual body text");
  });

  it("returns the full body when shorter than the cap", () => {
    expect(
      extractFeedSummary({
        frontmatter: {},
        html: "<p>short body</p>",
      }),
    ).toBe("short body");
  });

  it("truncates long bodies with a single ellipsis", () => {
    const body = "a".repeat(300);
    const summary = extractFeedSummary({
      frontmatter: {},
      html: `<p>${body}</p>`,
    });
    expect(summary).toHaveLength(DEFAULT_SUMMARY_LENGTH + 1);
    expect(summary.endsWith("…")).toBe(true);
  });

  it("counts emoji as a single grapheme", () => {
    const body = "🌱".repeat(DEFAULT_SUMMARY_LENGTH + 50);
    const summary = extractFeedSummary({
      frontmatter: {},
      html: `<p>${body}</p>`,
    });
    expect([...summary].length).toBe(DEFAULT_SUMMARY_LENGTH + 1);
    expect(summary.endsWith("…")).toBe(true);
  });

  it("returns an empty string when neither summary nor body has text", () => {
    expect(extractFeedSummary({ frontmatter: {}, html: "" })).toBe("");
    expect(extractFeedSummary({ frontmatter: {}, html: "<p></p>" })).toBe("");
  });
});
