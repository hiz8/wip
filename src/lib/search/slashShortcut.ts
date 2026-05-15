const TEXT_INPUT_TYPES = new Set(["text", "search", "email", "url", "tel", "password", "number"]);

export function isSlashShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return true;
  if (target.isContentEditable) return false;
  if (target instanceof HTMLTextAreaElement) return false;
  if (target instanceof HTMLInputElement) {
    const type = (target.type ?? "text").toLowerCase();
    return !TEXT_INPUT_TYPES.has(type);
  }
  return true;
}

export function bindSlashShortcut(onOpen: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: KeyboardEvent): void => {
    if (event.key !== "/") return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!isSlashShortcutTarget(event.target)) return;
    event.preventDefault();
    onOpen();
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
}
