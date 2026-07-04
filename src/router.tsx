import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.ts";

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    // tagset セグメントの集合区切り "+" を percent-encode させない (正規 URL を素の "+" で出す)
    pathParamsAllowedCharacters: ["+"],
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
