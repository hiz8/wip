import { existsSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { config as loadDotenv } from "dotenv";
import { siteConfigSchema, type SiteConfigParsed } from "./schema.ts";

export interface LoadConfigOptions {
  configPath?: string;
  envPath?: string;
  cwd?: string;
  loadEnv?: boolean;
}

export interface ResolveConfigOptions {
  cwd?: string;
  envPath?: string;
  loadEnv?: boolean;
}

export async function loadConfig(options: LoadConfigOptions = {}): Promise<SiteConfigParsed> {
  const cwd = options.cwd ?? process.cwd();
  const configPath = resolve(cwd, options.configPath ?? "site.config.ts");

  if (!existsSync(configPath)) {
    throw new Error(`site config not found at ${configPath}`);
  }

  const imported: unknown = await import(pathToFileURL(configPath).href);
  const raw = extractDefaultExport(imported);

  return resolveConfig(raw, {
    ...(options.cwd !== undefined ? { cwd: options.cwd } : {}),
    ...(options.envPath !== undefined ? { envPath: options.envPath } : {}),
    ...(options.loadEnv !== undefined ? { loadEnv: options.loadEnv } : {}),
  });
}

export function resolveConfig(raw: unknown, options: ResolveConfigOptions = {}): SiteConfigParsed {
  const cwd = options.cwd ?? process.cwd();

  if (options.loadEnv !== false) {
    const envPath = options.envPath ? resolve(cwd, options.envPath) : resolve(cwd, ".env");
    if (existsSync(envPath)) {
      loadDotenv({ path: envPath });
    }
  }

  const merged = mergeEnvOverrides(raw);
  const parsed = siteConfigSchema.parse(merged);

  const vaultRootResolved = resolve(cwd, parsed.content.vaultRoot);
  if (!existsSync(vaultRootResolved) || !statSync(vaultRootResolved).isDirectory()) {
    throw new Error(`content.vaultRoot does not exist or is not a directory: ${vaultRootResolved}`);
  }
  parsed.content.vaultRoot = vaultRootResolved;

  return parsed;
}

function extractDefaultExport(imported: unknown): unknown {
  if (imported !== null && typeof imported === "object" && "default" in imported) {
    return (imported as { default: unknown }).default;
  }
  return imported;
}

function mergeEnvOverrides(raw: unknown): unknown {
  const vaultRootEnv = process.env["VAULT_ROOT"];
  if (!vaultRootEnv) return raw;
  if (raw === null || typeof raw !== "object") return raw;

  const obj = raw as Record<string, unknown>;
  const content = (obj["content"] ?? {}) as Record<string, unknown>;
  return {
    ...obj,
    content: {
      ...content,
      vaultRoot: vaultRootEnv,
    },
  };
}
