import * as z from "zod";

const UUID_VERSIONS = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8"] as const;
type UUID_VERSION = (typeof UUID_VERSIONS)[number];

/** Gets UUID version information, if applicable */
export function getUUIDInfo(id: string): UUID_VERSION | undefined {
  for (const version of UUID_VERSIONS) {
    if (z.uuid({ version }).safeParse(id).success) return version;
  }
  return undefined;
}

/** Namespace UUID from which podcast:guid values are derived */
const PODCAST_GUID_NAMESPACE = "ead4c236-bf58-58c6-a2c6-a6b28d128cb6";

/** Derive the podcast:guid UUIDv5 from a feed URL, ignoring its scheme and trailing slashes */
export async function derivePodcastGUID(feedURL: string): Promise<string> {
  const seed = feedURL
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "")
    .replace(/\/+$/, "");
  return generateUUIDv5(seed, PODCAST_GUID_NAMESPACE);
}

/** Generate a UUIDv5 (RFC 9562) from a name and a namespace UUID */
async function generateUUIDv5(
  name: string,
  namespace: string,
): Promise<string> {
  const namespaceHex = namespace.replace(/-/g, "");
  const namespaceBytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    namespaceBytes[i] = Number.parseInt(namespaceHex.slice(i * 2, i * 2 + 2), 16);
  }
  const nameBytes = new TextEncoder().encode(name);
  const input = new Uint8Array(namespaceBytes.length + nameBytes.length);
  input.set(namespaceBytes);
  input.set(nameBytes, namespaceBytes.length);

  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-1", input)).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

/** Extract title using a regular expression */
export function extractTitle(xml: string): string | undefined {
  try {
    const match = xml.match(/<title[^>]*>([^<]*)<\/title>/i);
    return match?.at(1);
  } catch (error) {
    console.error(`extractTitle ERROR`, error);
    return undefined;
  }
}
