// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindSlashShortcut, isSlashShortcutTarget } from "@/lib/search/slashShortcut.ts";

describe("isSlashShortcutTarget", () => {
  it("returns true for a null target (window-level events)", () => {
    expect(isSlashShortcutTarget(null)).toBe(true);
  });

  it("returns true for a plain element", () => {
    const el = document.createElement("div");
    expect(isSlashShortcutTarget(el)).toBe(true);
  });

  it("returns false for a focused text input", () => {
    const input = document.createElement("input");
    input.type = "text";
    expect(isSlashShortcutTarget(input)).toBe(false);
  });

  it("returns false for a textarea", () => {
    const textarea = document.createElement("textarea");
    expect(isSlashShortcutTarget(textarea)).toBe(false);
  });

  it("returns false for a contentEditable element", () => {
    const el = document.createElement("div");
    el.contentEditable = "true";
    expect(isSlashShortcutTarget(el)).toBe(true);
    Object.defineProperty(el, "isContentEditable", { value: true });
    expect(isSlashShortcutTarget(el)).toBe(false);
  });

  it("returns true for a checkbox input (non-text)", () => {
    const input = document.createElement("input");
    input.type = "checkbox";
    expect(isSlashShortcutTarget(input)).toBe(true);
  });
});

describe("bindSlashShortcut", () => {
  let onOpen: ReturnType<typeof vi.fn<() => void>>;
  let cleanup: () => void;

  beforeEach(() => {
    onOpen = vi.fn<() => void>();
    cleanup = bindSlashShortcut(onOpen);
  });

  afterEach(() => {
    cleanup();
  });

  it("fires the callback when / is pressed outside an input", () => {
    const event = new KeyboardEvent("keydown", { key: "/", bubbles: true, cancelable: true });
    window.dispatchEvent(event);
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  it("does nothing when / is pressed with a modifier", () => {
    const event = new KeyboardEvent("keydown", { key: "/", ctrlKey: true });
    window.dispatchEvent(event);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does nothing while typing in a text input", () => {
    const input = document.createElement("input");
    input.type = "text";
    document.body.append(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "/", bubbles: true }));
    expect(onOpen).not.toHaveBeenCalled();
    input.remove();
  });

  it("cleanup removes the listener", () => {
    cleanup();
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }));
    expect(onOpen).not.toHaveBeenCalled();
  });
});
