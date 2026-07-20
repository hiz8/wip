import { useCallback, useEffect, useSyncExternalStore } from "react";
import { themeClasses } from "@/styles/theme.stylex.ts";
import {
  STORAGE_KEY,
  isPreference,
  systemPreference,
  type Preference,
  type Resolved,
} from "./constants.ts";

function readPreferenceFromStorage(): Preference {
  if (typeof window === "undefined") return "light";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isPreference(raw) ? raw : systemPreference();
  } catch {
    return systemPreference();
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
  return "light";
}

function splitClasses(className: string): string[] {
  return className.split(/\s+/u).filter(Boolean);
}

function applyPreference(pref: Preference): Resolved {
  if (typeof document === "undefined") return pref;
  const root = document.documentElement;
  const lightTokens = splitClasses(themeClasses.light);
  const darkTokens = splitClasses(themeClasses.dark);
  for (const token of lightTokens) root.classList.remove(token);
  for (const token of darkTokens) root.classList.remove(token);
  const tokens = pref === "dark" ? darkTokens : lightTokens;
  for (const token of tokens) root.classList.add(token);
  root.dataset["theme"] = pref;
  root.dataset["themeResolved"] = pref;
  root.style.colorScheme = pref;
  return pref;
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

  useEffect(() => {
    applyPreference(preference);
  }, [preference]);

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

  return { preference, resolved: preference, setPreference };
}
