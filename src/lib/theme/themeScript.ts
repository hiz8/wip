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
    var systemDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var pref = stored === "light" || stored === "dark" ? stored : (systemDark ? "dark" : "light");
    var root = document.documentElement;
    for (var i = 0; i < lightTokens.length; i++) root.classList.remove(lightTokens[i]);
    for (var j = 0; j < darkTokens.length; j++) root.classList.remove(darkTokens[j]);
    var tokens = pref === "dark" ? darkTokens : lightTokens;
    for (var k = 0; k < tokens.length; k++) root.classList.add(tokens[k]);
    root.dataset.theme = pref;
    root.dataset.themeResolved = pref;
    root.style.colorScheme = pref;
  } catch (_) {}
})();`;

export const themeScript: string = SCRIPT;
