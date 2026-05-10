// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalloutKindIcon } from "@/components/content/CalloutKindIcon.tsx";
import type { CalloutKind } from "@/types/content.ts";

const KINDS: ReadonlyArray<{ kind: CalloutKind; label: string }> = [
  { kind: "note", label: "Note" },
  { kind: "quote", label: "Quote" },
  { kind: "tip", label: "Tip" },
  { kind: "info", label: "Info" },
  { kind: "warning", label: "Warning" },
];

describe("CalloutKindIcon", () => {
  for (const { kind, label } of KINDS) {
    it(`renders an svg for kind="${kind}" with the matching aria-label`, () => {
      const { container } = render(<CalloutKindIcon kind={kind} />);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      expect(svg?.getAttribute("aria-label")).toBe(label);
      expect((svg?.children.length ?? 0) > 0).toBe(true);
    });
  }

  it("respects the size prop", () => {
    const { container } = render(<CalloutKindIcon kind="info" size={28} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("28");
    expect(svg?.getAttribute("height")).toBe("28");
  });
});
