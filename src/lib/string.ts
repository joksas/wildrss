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
