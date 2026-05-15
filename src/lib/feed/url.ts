export function joinSiteUrl(siteUrl: string, pathname: string): string {
  const base = siteUrl.endsWith("/") ? siteUrl.slice(0, -1) : siteUrl;
  if (pathname === "" || pathname === "/") return `${base}/`;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const segments = path.split("/").map((segment, index) => {
    if (index === 0) return segment;
    return encodeURIComponent(segment);
  });
  return `${base}${segments.join("/")}`;
}

const XML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};
const XML_ESCAPE_RE = /[&<>"']/gu;

export function escapeXml(value: string): string {
  return value.replace(XML_ESCAPE_RE, (ch) => XML_ESCAPE_MAP[ch] ?? ch);
}
