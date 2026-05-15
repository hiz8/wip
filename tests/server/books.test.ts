import { afterEach, describe, expect, it } from "vitest";
import {
  __resetBooksCacheForTests,
  __setBooksConfigForTests,
  getAllBooks,
  getBookByIsbn,
  getBookCoverMap,
} from "@/server/books.ts";
import { makeConfig } from "../helpers/makeConfig.ts";

describe("server/books data layer", () => {
  afterEach(() => {
    __resetBooksCacheForTests();
  });

  it("getAllBooks returns books sorted by pubYear desc (undefined last)", async () => {
    __setBooksConfigForTests(makeConfig("vault"));
    const books = await getAllBooks();
    expect(books.map((b) => b.slug)).toEqual(["9784873119045", "9784000000001", "9784000000000"]);
  }, 30_000);

  it("getBookByIsbn returns the rendered book for a known ISBN", async () => {
    __setBooksConfigForTests(makeConfig("vault"));
    const book = await getBookByIsbn("9784873119045");
    expect(book).toBeDefined();
    expect(book?.title).toBe("リファクタリング");
    expect(book?.frontmatter.pubYear).toBe(2019);
  }, 30_000);

  it("getBookByIsbn returns undefined for an unknown ISBN", async () => {
    __setBooksConfigForTests(makeConfig("vault"));
    const book = await getBookByIsbn("9999999999999");
    expect(book).toBeUndefined();
  }, 30_000);

  it("getBookCoverMap resolves the fixture book cover to /images/sample-cover.png", async () => {
    __setBooksConfigForTests(makeConfig("vault"));
    const covers = await getBookCoverMap();
    expect(covers.get("9784873119045")).toBe("/images/sample-cover.png");
    expect(covers.get("9784000000000")).toBeUndefined();
  }, 30_000);
});
