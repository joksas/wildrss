import * as z from "zod";

/** Schema representing HTTP or HTTPS web URL */
export const WebURL = z.url({
  protocol: /^https?$/,
  hostname: z.regexes.domain,
  message: "Not a valid web URL",
});

/** Checks if valid web URL (http or https) */
export function isWebURL(url: string): boolean {
  return WebURL.safeParse(url).success;
}

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
