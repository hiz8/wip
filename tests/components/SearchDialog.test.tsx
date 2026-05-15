// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchDialog } from "@/components/common/SearchDialog.tsx";

const pagefindCtor = vi.fn<(options: { element: HTMLElement }) => void>();

vi.mock("/pagefind/pagefind-ui.js", () => {
  function MockPagefindUI(this: object, options: { element: HTMLElement }) {
    pagefindCtor(options);
  }
  return { PagefindUI: MockPagefindUI };
});

const noop = () => {};

function Harness() {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), []);
  return (
    <>
      <button type="button" onClick={handleOpen}>
        open
      </button>
      <SearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

describe("SearchDialog", () => {
  beforeEach(() => {
    pagefindCtor.mockReset();
  });

  afterEach(() => {
    // Strip stylesheet links injected on previous renders.
    for (const link of document.querySelectorAll('link[href="/pagefind/pagefind-ui.css"]')) {
      link.remove();
    }
  });

  it("does not render the dialog when closed", () => {
    render(<SearchDialog open={false} onOpenChange={noop} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog and mounts Pagefind UI when opened", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByRole("dialog", { name: "サイト内検索" })).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(pagefindCtor).toHaveBeenCalledTimes(1);
    });
    expect(pagefindCtor.mock.calls[0]?.[0]?.element).toBeInstanceOf(HTMLElement);
  });

  it("injects the Pagefind stylesheet exactly once", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));
    await vi.waitFor(() => {
      expect(document.querySelectorAll('link[href="/pagefind/pagefind-ui.css"]').length).toBe(1);
    });
  });
});
