import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { themeClasses } from "@/styles/theme.stylex.ts";
import { STORAGE_KEY, isPreference, type Preference, type Resolved } from "./constants.ts";

const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

function readPreferenceFromStorage(): Preference {
  if (typeof window === "undefined") return "system";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isPreference(raw) ? raw : "system";
  } catch {
    return "system";
  }
}

function subscribeStorage(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getServerSnapshot(): Preference {
  return "system";
}

function splitClasses(className: string): string[] {
  return className.split(/\s+/u).filter(Boolean);
}

function applyPreference(pref: Preference, systemDark: boolean): Resolved {
  if (typeof document === "undefined") {
    return pref === "dark" || (pref === "system" && systemDark) ? "dark" : "light";
  }
  const root = document.documentElement;
  const lightTokens = splitClasses(themeClasses.light);
  const darkTokens = splitClasses(themeClasses.dark);
  for (const token of lightTokens) root.classList.remove(token);
  for (const token of darkTokens) root.classList.remove(token);
  if (pref === "light") for (const token of lightTokens) root.classList.add(token);
  if (pref === "dark") for (const token of darkTokens) root.classList.add(token);
  const resolved: Resolved =
    pref === "dark" || (pref === "system" && systemDark) ? "dark" : "light";
  root.dataset["theme"] = pref;
  root.dataset["themeResolved"] = resolved;
  root.style.colorScheme = resolved;
  return resolved;
}

export interface UseThemeResult {
  preference: Preference;
  resolved: Resolved;
  setPreference: (next: Preference) => void;
}

export function useTheme(): UseThemeResult {
  const preference = useSyncExternalStore(
    subscribeStorage,
    readPreferenceFromStorage,
    getServerSnapshot,
  );

  const [systemDark, setSystemDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(SYSTEM_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(SYSTEM_QUERY);
    const handler = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    media.addEventListener("change", handler);
    setSystemDark(media.matches);
    return () => media.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    applyPreference(preference, systemDark);
  }, [preference, systemDark]);

  const setPreference = useCallback((next: Preference) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 無視する */
    }
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY,
        newValue: next,
      }),
    );
  }, []);

  const resolved: Resolved =
    preference === "dark" || (preference === "system" && systemDark) ? "dark" : "light";

  return { preference, resolved, setPreference };
}
