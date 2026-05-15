// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BookHeader } from "@/components/content/BookHeader.tsx";

const BASE_PROPS = {
  title: "リファクタリング",
  authors: ["Martin Fowler"],
  isbn: "9784873119045",
  pubYear: 2019,
  publisher: "O'Reilly",
  readDate: "2024-08-01",
} as const;

describe("BookHeader", () => {
  it("renders a placeholder div when coverUrl is null", () => {
    render(<BookHeader {...BASE_PROPS} coverUrl={null} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("リファクタリング");
    expect(document.querySelector("img")).toBeNull();
    const placeholder = document.querySelector('div[aria-hidden="true"]');
    expect(placeholder).not.toBeNull();
    expect(placeholder?.textContent).toBe("リファクタリング");
  });

  it("renders an <img> when coverUrl is provided", () => {
    render(<BookHeader {...BASE_PROPS} coverUrl="/images/sample-cover.png" />);
    const img = document.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/images/sample-cover.png");
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull();
  });
});
