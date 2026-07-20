export const STORAGE_KEY = "wip:theme";

export type Preference = "light" | "dark";
export type Resolved = "light" | "dark";

export const PREFERENCES: readonly Preference[] = ["light", "dark"] as const;

export function isPreference(value: unknown): value is Preference {
  return value === "light" || value === "dark";
}

export function nextPreference(current: Preference): Preference {
  return current === "dark" ? "light" : "dark";
}

// 保存値が無い/不正なときの初期テーマをシステム設定から導く。
// themeScript.ts のプリハイドレーション判定と同じロジックに揃える。
// window / matchMedia が使えない環境ではライトにフォールバックする。
export function systemPreference(): Preference {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
