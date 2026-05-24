// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DetailLayout } from "@/components/layout/DetailLayout.tsx";

describe("DetailLayout", () => {
  it("hasMarginalia=false ではガター div を描画しない", () => {
    const { container } = render(
      <DetailLayout hasMarginalia={false}>
        <p data-testid="body">body</p>
      </DetailLayout>,
    );

    const ariaHiddenDivs = container.querySelectorAll('div[aria-hidden="true"]');
    expect(ariaHiddenDivs.length).toBe(0);
  });

  it("hasMarginalia=true で左右のガター div を描画する", () => {
    const { container } = render(
      <DetailLayout hasMarginalia={true}>
        <p data-testid="body">body</p>
      </DetailLayout>,
    );

    const ariaHiddenDivs = container.querySelectorAll('div[aria-hidden="true"]');
    expect(ariaHiddenDivs.length).toBe(2);
  });
});
