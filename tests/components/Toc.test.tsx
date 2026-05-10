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

function appendHeadings(entries: readonly TocEntry[]): void {
  for (const entry of entries) {
    const h = document.createElement("h2");
    h.id = entry.id;
    h.textContent = entry.text;
    document.body.append(h);
  }
}

const NO_ENTRIES: readonly TocEntry[] = [];

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

  it("marks the deepest visible heading as the active link", () => {
    appendHeadings(ENTRIES);
    render(<Toc entries={ENTRIES} />);
    expect(instances.length).toBe(1);
    const observer = instances[0]!;
    act(() => {
      observer.fire([
        {
          target: document.querySelector("#first")!,
          isIntersecting: true,
          boundingClientRect: { top: 10 },
        },
        {
          target: document.querySelector("#nested")!,
          isIntersecting: true,
          boundingClientRect: { top: 200 },
        },
      ]);
    });
    const nav = screen.getByRole("navigation", { name: /table of contents/iu });
    const links = nav.querySelectorAll("a");
    const byText = (text: string): HTMLAnchorElement | undefined =>
      Array.from(links).find((a) => a.textContent === text);
    expect(byText("Nested")?.getAttribute("aria-current")).toBe("location");
    expect(byText("First")?.getAttribute("aria-current")).toBeNull();
  });
});
