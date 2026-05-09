const IMAGE_EXT_RE = /\.(?:png|jpe?g|gif|svg|webp|avif|bmp|ico)$/i;

export function isImagePath(value: string): boolean {
  const path = value.split("|")[0]?.trim() ?? "";
  return IMAGE_EXT_RE.test(path);
}
