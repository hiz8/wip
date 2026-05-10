export const STORAGE_KEY = "wip:theme";

export type Preference = "system" | "light" | "dark";
export type Resolved = "light" | "dark";

export const PREFERENCES: readonly Preference[] = ["system", "light", "dark"] as const;

export function isPreference(value: unknown): value is Preference {
  return value === "system" || value === "light" || value === "dark";
}

export function nextPreference(current: Preference): Preference {
  const index = PREFERENCES.indexOf(current);
  return PREFERENCES[(index + 1) % PREFERENCES.length] ?? "system";
}
