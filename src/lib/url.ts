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

const QUERY_EXTENSION = /\.([A-Za-z0-9]+)$/;

/** Get a URL's file extension from its path, or from a query ending in one (e.g. `/abc?.jpg`) */
export function getUrlExtension(url: string): string | undefined {
  try {
    const { pathname, search } = new URL(url);
    const lastSegment = decodeURIComponent(pathname.split("/").pop() || "");
    const dotIndex = lastSegment.lastIndexOf(".");
    if (dotIndex > 0) return lastSegment.slice(dotIndex + 1) || undefined;
    return QUERY_EXTENSION.exec(search)?.[1];
  } catch {
    return undefined;
  }
}
