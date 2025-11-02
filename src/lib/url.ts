/** Tests if a URL has an extension */
export function urlHasExtension(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    const last_segment = pathname.split("/").pop() || "";
    return /\.[a-z0-9]+$/i.test(last_segment);
  } catch {
    return false;
  }
}
