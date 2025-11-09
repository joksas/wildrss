/** Tests if a URL has an extension */
export function getUrlExtension(url: string): string | undefined {
  try {
    const { pathname } = new URL(url);
    const last_segment = pathname.split("/").pop() || "";
    const parts = last_segment.split(".").filter(Boolean);
    if (parts.length < 2) return undefined;
    return parts.slice(1).join(".");
  } catch {
    return undefined;
  }
}
