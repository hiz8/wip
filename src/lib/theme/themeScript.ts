import { themeClasses } from "@/styles/theme.stylex.ts";
import { STORAGE_KEY } from "./constants.ts";

const lightTokens = themeClasses.light.split(/\s+/u).filter(Boolean);
const darkTokens = themeClasses.dark.split(/\s+/u).filter(Boolean);

const SCRIPT = `(function () {
  try {
    var key = ${JSON.stringify(STORAGE_KEY)};
    var lightTokens = ${JSON.stringify(lightTokens)};
    var darkTokens = ${JSON.stringify(darkTokens)};
    var stored = null;
    try { stored = window.localStorage.getItem(key); } catch (_) {}
    var pref = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    var root = document.documentElement;
    for (var i = 0; i < lightTokens.length; i++) root.classList.remove(lightTokens[i]);
    for (var j = 0; j < darkTokens.length; j++) root.classList.remove(darkTokens[j]);
    if (pref === "light") for (var k = 0; k < lightTokens.length; k++) root.classList.add(lightTokens[k]);
    if (pref === "dark") for (var l = 0; l < darkTokens.length; l++) root.classList.add(darkTokens[l]);
    var resolved;
    if (pref === "system") {
      resolved = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      resolved = pref;
    }
    root.dataset.theme = pref;
    root.dataset.themeResolved = resolved;
    root.style.colorScheme = resolved;
  } catch (_) {}
})();`;

export const themeScript: string = SCRIPT;
