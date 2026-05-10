import type { RenderedGlossaryTerm } from "@/types/content.ts";
import type { SiteConfigParsed } from "@/lib/config/schema.ts";
import {
  __resetSiteDatasetForTests,
  __setSiteDatasetConfigForTests,
  getSiteDataset,
  groupGlossaryByFurigana,
  type GlossaryGroupSection,
} from "./datasets.ts";

export type { GlossaryGroupSection } from "./datasets.ts";

export async function getAllGlossaryTerms(): Promise<RenderedGlossaryTerm[]> {
  const data = await getSiteDataset();
  return data.glossary;
}

export async function getGlossaryTermBySlug(
  slug: string,
): Promise<RenderedGlossaryTerm | undefined> {
  const data = await getSiteDataset();
  return data.bySlug.glossary.get(slug);
}

export async function getGlossaryGroupedIndex(): Promise<GlossaryGroupSection[]> {
  const data = await getSiteDataset();
  return groupGlossaryByFurigana(data.glossary);
}

export function __resetGlossaryCacheForTests(): void {
  __resetSiteDatasetForTests();
}

export function __setGlossaryConfigForTests(config: SiteConfigParsed): void {
  __setSiteDatasetConfigForTests(config);
}
