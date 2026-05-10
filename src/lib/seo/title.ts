import { SITE_NAME } from "@/lib/config/static.ts";

export function makeTitle(pageTitle: string | null | undefined): string {
  const trimmed = pageTitle?.trim() ?? "";
  if (trimmed === "" || trimmed === SITE_NAME) return SITE_NAME;
  return `${trimmed} | ${SITE_NAME}`;
}
