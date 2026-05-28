// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toc } from "@/components/content/Toc.tsx";
import type { TocEntry } from "@/types/content.ts";

interface IOEntryStub {
  target: Element;
  isIntersecting: boolean;
  boundingClientRect: { top: number };
}

interface ObserverInstance {
  callback: (entries: IOEntryStub[]) => void;
  targets: Set<Element>;
  fire: (entries: IOEntryStub[]) => void;
}

function installIntersectionObserver(): ObserverInstance[] {
  const instances: ObserverInstance[] = [];
  class MockIntersectionObserver {
    callback: (entries: IOEntryStub[]) => void;
    targets = new Set<Element>();
    constructor(cb: (entries: IOEntryStub[]) => void) {
      this.callback = cb;
      instances.push({
        callback: cb,
        targets: this.targets,
        fire: (entries) => cb(entries),
      });
    }
    observe(el: Element) {
      this.targets.add(el);
    }
    unobserve(el: Element) {
      this.targets.delete(el);
    }
    disconnect() {
      this.targets.clear();
    }
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  return instances;
}

const ENTRIES: readonly TocEntry[] = [
  { depth: 2, text: "First", id: "first" },
  { depth: 3, text: "Nested", id: "nested" },
  { depth: 2, text: "Second", id: "second" },
];

// Mirror the structure produced by rehypeSectionize: each h2 wraps a
// <section data-heading-id>, and h3 sections nest inside their parent h2.
function appendSections(entries: readonly TocEntry[]): Map<string, HTMLElement> {
  const byId = new Map<string, HTMLElement>();
  let current: HTMLElement | null = null;
  for (const entry of entries) {
    const section = document.createElement("section");
    section.dataset["headingId"] = entry.id;
    const h = document.createElement(entry.depth === 3 ? "h3" : "h2");
    h.id = entry.id;
    h.textContent = entry.text;
    section.append(h);
    byId.set(entry.id, section);
    if (entry.depth === 2) {
      document.body.append(section);
      current = section;
    } else if (current) {
      current.append(section);
    } else {
      document.body.append(section);
    }
  }
  return byId;
}

const NO_ENTRIES: readonly TocEntry[] = [];
const SINGLE_ENTRY: readonly TocEntry[] = [{ depth: 2, text: "Only", id: "only" }];

// Stub getBoundingClientRect on a single element. Returns a restore callback
// so individual tests can clean up without leaking spies into later tests.
function stubRect(el: Element, rect: Partial<DOMRect>): () => void {
  const full = {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...rect,
  } as DOMRect;
  const spy = vi.spyOn(el, "getBoundingClientRect").mockReturnValue(full);
  return () => spy.mockRestore();
}

function activeLinks(): Set<string> {
  const nav = screen.getByRole("navigation", { name: "目次" });
  const active = new Set<string>();
  for (const a of nav.querySelectorAll<HTMLAnchorElement>("a")) {
    if (a.getAttribute("aria-current") === "location") {
      active.add(a.textContent ?? "");
    }
  }
  return active;
}

describe("Toc", () => {
  let instances: ObserverInstance[] = [];

  beforeEach(() => {
    instances = installIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("renders nothing when there are no entries", () => {
    const { container } = render(<Toc entries={NO_ENTRIES} />);
    expect(container.firstChild).toBeNull();
  });

  it("highlights every TOC entry whose section is currently visible", () => {
    const byId = appendSections(ENTRIES);
    render(<Toc entries={ENTRIES} />);
    const observer = instances[0]!;
    act(() => {
      observer.fire([
        { target: byId.get("first")!, isIntersecting: true, boundingClientRect: { top: 0 } },
        { target: byId.get("nested")!, isIntersecting: true, boundingClientRect: { top: 100 } },
      ]);
    });
    expect(activeLinks()).toEqual(new Set(["First", "Nested"]));
  });

  it("drops a TOC entry from active when its section leaves the viewport", () => {
    const byId = appendSections(ENTRIES);
    render(<Toc entries={ENTRIES} />);
    const observer = instances[0]!;
    act(() => {
      observer.fire([
        { target: byId.get("first")!, isIntersecting: true, boundingClientRect: { top: 0 } },
        { target: byId.get("nested")!, isIntersecting: true, boundingClientRect: { top: 100 } },
      ]);
    });
    act(() => {
      observer.fire([
        {
          target: byId.get("nested")!,
          isIntersecting: false,
          boundingClientRect: { top: -50 },
        },
      ]);
    });
    expect(activeLinks()).toEqual(new Set(["First"]));
  });

  it("ignores the spurious initial 'not intersecting' callback", () => {
    const byId = appendSections(ENTRIES);
    render(<Toc entries={ENTRIES} />);
    const observer = instances[0]!;
    act(() => {
      observer.fire(
        ENTRIES.map((entry) => ({
          target: byId.get(entry.id)!,
          isIntersecting: false,
          boundingClientRect: { top: 999 },
        })),
      );
    });
    expect(activeLinks().size).toBe(0);
  });

  // rehypeSectionize nests h3 sections inside their parent h2 section, so
  // the h2 stays active for the entire span of its children. topActiveId
  // picks the first active h3 instead, falling back to the topmost active
  // h2 when no h3 is active. The next two cases pin both branches by
  // observing which link the sync-scroll effect targets.
  it("scrolls the nav to the first active h3 even when the parent h2 is also active", () => {
    const byId = appendSections(ENTRIES);
    const { container } = render(<Toc entries={ENTRIES} />);
    const nav = container.querySelector("nav")!;
    const firstLink = nav.querySelector<HTMLAnchorElement>('[data-toc-id="first"]')!;
    const nestedLink = nav.querySelector<HTMLAnchorElement>('[data-toc-id="nested"]')!;
    // h2 link sits inside the nav viewport (delta 0 if it were picked); h3
    // link sits below the nav so picking it produces a positive delta.
    const restoreNav = stubRect(nav, { top: 0, bottom: 100 });
    const restoreFirst = stubRect(firstLink, { top: 10, bottom: 30 });
    const restoreNested = stubRect(nestedLink, { top: 200, bottom: 220 });
    const scrollBy = vi.fn<() => void>();
    nav.scrollBy = scrollBy as unknown as Element["scrollBy"];

    const observer = instances[0]!;
    act(() => {
      observer.fire([
        { target: byId.get("first")!, isIntersecting: true, boundingClientRect: { top: 0 } },
        { target: byId.get("nested")!, isIntersecting: true, boundingClientRect: { top: 100 } },
      ]);
    });

    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: 120 });
    restoreNav();
    restoreFirst();
    restoreNested();
  });

  it("falls back to the topmost active h2 when no h3 is active", () => {
    const byId = appendSections(ENTRIES);
    const { container } = render(<Toc entries={ENTRIES} />);
    const nav = container.querySelector("nav")!;
    const firstLink = nav.querySelector<HTMLAnchorElement>('[data-toc-id="first"]')!;
    const secondLink = nav.querySelector<HTMLAnchorElement>('[data-toc-id="second"]')!;
    // Distinct deltas so the assertion disambiguates: "first" → 50,
    // "second" → 150. The test expects "first".
    const restoreNav = stubRect(nav, { top: 0, bottom: 100 });
    const restoreFirst = stubRect(firstLink, { top: 100, bottom: 150 });
    const restoreSecond = stubRect(secondLink, { top: 200, bottom: 250 });
    const scrollBy = vi.fn<() => void>();
    nav.scrollBy = scrollBy as unknown as Element["scrollBy"];

    const observer = instances[0]!;
    act(() => {
      observer.fire([
        { target: byId.get("first")!, isIntersecting: true, boundingClientRect: { top: 0 } },
        { target: byId.get("second")!, isIntersecting: true, boundingClientRect: { top: 100 } },
      ]);
    });

    expect(scrollBy).toHaveBeenCalledTimes(1);
    expect(scrollBy).toHaveBeenCalledWith({ top: 50 });
    restoreNav();
    restoreFirst();
    restoreSecond();
  });

  it("focuses the heading and replaces the URL hash on TOC link click", () => {
    appendSections(ENTRIES);
    render(<Toc entries={ENTRIES} />);
    const heading = document.querySelector<HTMLElement>("#nested")!;
    const scrollIntoView = vi.fn<() => void>();
    heading.scrollIntoView = scrollIntoView as unknown as HTMLElement["scrollIntoView"];
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("link", { name: "Nested" }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "#nested");
    expect(heading.getAttribute("tabindex")).toBe("-1");
    expect(document.activeElement).toBe(heading);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    replaceState.mockRestore();
  });

  it("leaves modifier-key clicks alone so the browser opens them natively", () => {
    appendSections(ENTRIES);
    render(<Toc entries={ENTRIES} />);
    const heading = document.querySelector<HTMLElement>("#nested")!;
    const scrollIntoView = vi.fn<() => void>();
    heading.scrollIntoView = scrollIntoView as unknown as HTMLElement["scrollIntoView"];
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("link", { name: "Nested" }), { metaKey: true });

    expect(replaceState).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(heading.hasAttribute("tabindex")).toBe(false);
    replaceState.mockRestore();
  });

  // The callback ref exists so the listener attaches even when <nav> mounts
  // on a later render — e.g., the first render returned null because
  // entries.length < 2. A useEffect with [] deps would miss this case.
  it("attaches click delegation when the nav mounts after a later render", () => {
    const { rerender } = render(<Toc entries={SINGLE_ENTRY} />);
    expect(screen.queryByRole("navigation")).toBeNull();

    appendSections(ENTRIES);
    rerender(<Toc entries={ENTRIES} />);

    const heading = document.querySelector<HTMLElement>("#nested")!;
    const scrollIntoView = vi.fn<() => void>();
    heading.scrollIntoView = scrollIntoView as unknown as HTMLElement["scrollIntoView"];
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("link", { name: "Nested" }));

    expect(replaceState).toHaveBeenCalledWith(null, "", "#nested");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    replaceState.mockRestore();
  });
});
