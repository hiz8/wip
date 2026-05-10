import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveConfig } from "@/lib/config/index.ts";
import siteConfigInput from "../../../site.config.ts";
import {
  SITE_DESCRIPTION,
  SITE_LOCALE,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_URL,
} from "@/lib/config/static.ts";

describe("static config mirror", () => {
  it("matches the values produced by resolveConfig (drift guard)", () => {
    const original = process.env["VAULT_ROOT"];
    process.env["VAULT_ROOT"] = resolve(__dirname, "../../fixtures/vault");
    try {
      const resolved = resolveConfig(siteConfigInput, { loadEnv: false });
      expect(SITE_NAME).toBe(resolved.site.name);
      expect(SITE_DESCRIPTION).toBe(resolved.site.description);
      expect(SITE_URL).toBe(resolved.site.url);
      expect(SITE_LOCALE).toBe(resolved.site.locale);
      expect(SITE_OG_IMAGE).toBe(resolved.site.ogImage ?? "");
    } finally {
      if (original === undefined) delete process.env["VAULT_ROOT"];
      else process.env["VAULT_ROOT"] = original;
    }
  });
});
