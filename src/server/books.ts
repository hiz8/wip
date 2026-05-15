import type { RenderedBook } from "@/types/content.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import {
  __resetSiteDatasetForTests,
  __setSiteDatasetConfigForTests,
  getSiteDataset,
} from "./datasets.ts";

export async function getAllBooks(): Promise<RenderedBook[]> {
  const data = await getSiteDataset();
  return data.books;
}

export async function getBookByIsbn(isbn: string): Promise<RenderedBook | undefined> {
  const data = await getSiteDataset();
  return data.bySlug.books.get(isbn);
}

export async function getBookCoverMap(): Promise<ReadonlyMap<string, string>> {
  const data = await getSiteDataset();
  return data.coverBySlug;
}

export function __resetBooksCacheForTests(): void {
  __resetSiteDatasetForTests();
}

export function __setBooksConfigForTests(config: SiteConfigParsed): void {
  __setSiteDatasetConfigForTests(config);
}
