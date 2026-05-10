import { describe, expect, it } from "vitest";
import { computeMarginaliaPlacements } from "@/lib/marginalia/placements.ts";

describe("computeMarginaliaPlacements", () => {
  it("returns an empty array for empty input", () => {
    expect(computeMarginaliaPlacements([])).toEqual([]);
  });

  it("preserves anchor positions when items do not overlap", () => {
    const placements = computeMarginaliaPlacements([
      { id: "a", top: 0, height: 50 },
      { id: "b", top: 200, height: 50 },
    ]);
    expect(placements).toEqual([
      { id: "a", top: 0 },
      { id: "b", top: 200 },
    ]);
  });

  it("pushes later items down when the previous one overlaps", () => {
    const placements = computeMarginaliaPlacements(
      [
        { id: "a", top: 0, height: 100 },
        { id: "b", top: 50, height: 100 },
        { id: "c", top: 60, height: 50 },
      ],
      { gap: 8 },
    );
    expect(placements).toEqual([
      { id: "a", top: 0 },
      { id: "b", top: 108 },
      { id: "c", top: 216 },
    ]);
  });

  it("sorts by top before resolving overlaps", () => {
    const placements = computeMarginaliaPlacements([
      { id: "later", top: 200, height: 50 },
      { id: "earlier", top: 0, height: 50 },
    ]);
    expect(placements.map((p) => p.id)).toEqual(["earlier", "later"]);
  });

  it("treats negative heights as zero so the next item is not dragged backwards", () => {
    const placements = computeMarginaliaPlacements(
      [
        { id: "a", top: 0, height: -50 },
        { id: "b", top: 4, height: 0 },
      ],
      { gap: 8 },
    );
    expect(placements).toEqual([
      { id: "a", top: 0 },
      { id: "b", top: 8 },
    ]);
  });
});
