// @vitest-environment jsdom
import { useEffect, useRef } from "react";
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Marginalia } from "@/components/content/Marginalia.tsx";
import type { CalloutEntry, FootnoteEntry } from "@/types/content.ts";

class StubObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): MutationRecord[] {
    return [];
  }
}

const EMPTY_FOOTNOTES: readonly FootnoteEntry[] = [];
const EMPTY_CALLOUTS: readonly CalloutEntry[] = [];
const EMPTY_REF = { current: null } as const;
const SINGLE_FOOTNOTE: readonly FootnoteEntry[] = [{ id: "1", label: "1", html: "<p>fn</p>" }];
const FOOTNOTE_BODY_HTML =
  '<a id="user-content-fnref-1" data-footnote-ref href="#user-content-fn-1">1</a>';

function installRafSync(): void {
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
}

function installObservers(): void {
  vi.stubGlobal("ResizeObserver", StubObserver);
  vi.stubGlobal("MutationObserver", StubObserver);
}

function stubGetBoundingClientRect(el: HTMLElement, top: number, height = 20): void {
  el.getBoundingClientRect = () =>
    ({
      top,
      left: 0,
      right: 100,
      bottom: top + height,
      width: 100,
      height,
      x: 0,
      y: top,
      toJSON: () => ({}),
    }) as DOMRect;
}

interface HarnessProps {
  bodyHtml: string;
  footnotes: readonly FootnoteEntry[];
  callouts: readonly CalloutEntry[];
}

function Harness({ bodyHtml, footnotes, callouts }: HarnessProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const html = useRef({ __html: bodyHtml });
  useEffect(() => {
    const body = contentRef.current;
    if (!body) return;
    stubGetBoundingClientRect(body, 0, 200);
    const sup = body.querySelector<HTMLElement>("a[data-footnote-ref]");
    if (sup) stubGetBoundingClientRect(sup, 30, 18);
  });
  return (
    <>
      <div ref={contentRef} dangerouslySetInnerHTML={html.current} />
      <Marginalia side="right" contentRef={contentRef} footnotes={footnotes} callouts={callouts} />
    </>
  );
}

describe("Marginalia", () => {
  beforeEach(() => {
    installObservers();
    installRafSync();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("renders nothing when there are neither footnotes nor callouts", () => {
    const { container } = render(
      <Marginalia
        side="right"
        contentRef={EMPTY_REF}
        footnotes={EMPTY_FOOTNOTES}
        callouts={EMPTY_CALLOUTS}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders an aside with the matching data-marginalia-side attribute", () => {
    const { container } = render(
      <Harness
        bodyHtml={FOOTNOTE_BODY_HTML}
        footnotes={SINGLE_FOOTNOTE}
        callouts={EMPTY_CALLOUTS}
      />,
    );
    const aside = container.querySelector('aside[data-marginalia-side="right"]');
    expect(aside).not.toBeNull();
  });
});
