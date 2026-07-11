// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchDialog } from "@/components/common/SearchDialog.tsx";

const pagefindCtor = vi.fn<(options: { element: HTMLElement }) => void>();

// pagefind-ui.js (IIFE) が script onload 時に window.PagefindUI を生やす挙動を再現する。
function installPagefindGlobal(): void {
  function MockPagefindUI(this: object, options: { element: HTMLElement }) {
    pagefindCtor(options);
  }
  window.PagefindUI = MockPagefindUI as unknown as NonNullable<typeof window.PagefindUI>;
}

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
    // 以前の render で inject された stylesheet の link を取り除く。
    for (const link of document.querySelectorAll('link[href="/pagefind/pagefind-ui.css"]')) {
      link.remove();
    }
    delete window.PagefindUI;
  });

  it("does not render the dialog when closed", () => {
    render(<SearchDialog open={false} onOpenChange={noop} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  // モジュールスコープの singleton が構築済みコンストラクタをキャッシュするため、
  // script 注入経路を検証するこのテストは同一ファイル内の最初の open である必要がある。
  it("loads pagefind-ui.js via a script tag and mounts Pagefind UI when opened", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(screen.getByRole("dialog", { name: "サイト内検索" })).toBeInTheDocument();

    // jsdom は script を実ロードしないため、IIFE 実行 (グローバル定義) と load を模倣する。
    const script = await vi.waitFor(() => {
      const found = document.querySelector<HTMLScriptElement>(
        'script[src="/pagefind/pagefind-ui.js"]',
      );
      expect(found).not.toBeNull();
      return found as HTMLScriptElement;
    });
    installPagefindGlobal();
    script.dispatchEvent(new Event("load"));

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
