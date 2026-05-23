// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
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

function activeLinks(): Set<string> {
  const nav = screen.getByRole("navigation", { name: /table of contents/iu });
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
});
