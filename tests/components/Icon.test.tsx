// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon, type IconType } from "@/components/common/Icon.tsx";

const TYPES: readonly IconType[] = [
  "home",
  "homeBold",
  "github",
  "global",
  "works",
  "blog",
  "notebook",
  "notebookBold",
  "notes",
  "notesBold",
  "book",
  "bookBold",
  "externalLink",
  "search",
  "sun",
  "moon",
  "panelLeft",
];

describe("Icon", () => {
  for (const type of TYPES) {
    it(`renders a span for type="${type}"`, () => {
      const { container } = render(<Icon type={type} />);
      expect(container.querySelector("span")).not.toBeNull();
    });
  }

  it("emits a distinct class per type", () => {
    const classNames = TYPES.map((type) => {
      const { container } = render(<Icon type={type} />);
      return container.querySelector("span")?.getAttribute("class") ?? "";
    });
    expect(new Set(classNames).size).toBe(TYPES.length);
  });

  it("exposes role=img and aria-label when a label is given", () => {
    const { container } = render(<Icon type="github" label="GitHub" />);
    const span = container.querySelector("span");
    expect(span?.getAttribute("role")).toBe("img");
    expect(span?.getAttribute("aria-label")).toBe("GitHub");
    expect(span?.getAttribute("aria-hidden")).toBeNull();
  });

  it("is decorative (aria-hidden, unlabeled) when no label is given", () => {
    const { container } = render(<Icon type="github" />);
    const span = container.querySelector("span");
    expect(span?.getAttribute("aria-hidden")).toBe("true");
    expect(span?.getAttribute("role")).toBeNull();
    expect(span?.getAttribute("aria-label")).toBeNull();
  });

  it("applies size through an inline style variable", () => {
    const { container } = render(<Icon type="home" size={28} />);
    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.getAttribute("style")).toContain("28px");
  });
});
