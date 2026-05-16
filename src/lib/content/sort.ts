export function compareByUpdatedDesc<T>(
  getUpdated: (item: T) => string,
  getSlug: (item: T) => string,
): (a: T, b: T) => number {
  return (a, b) => {
    const au = getUpdated(a);
    const bu = getUpdated(b);
    if (au === bu) return getSlug(a).localeCompare(getSlug(b));
    return au < bu ? 1 : -1;
  };
}
