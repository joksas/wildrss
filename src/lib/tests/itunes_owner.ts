import type { Test } from "./_index";

const ALLOWED_CHILDREN = ["itunes:name", "itunes:email"];
export const testItunesOwner: Test = {
  name: "itunes:owner tag",
  test: async (xml) => {
    // itunes:owner
    const itunesOwnerTags = xml.rss.at(0)?.channel.at(0)?.["itunes:owner"];
    const itunesOwnerTag = itunesOwnerTags?.at(0);
    if (!itunesOwnerTag) return { status: "passed" };
    if (itunesOwnerTags && itunesOwnerTags?.length > 1)
      return {
        status: "failed",
        error: `Found ${itunesOwnerTags.length} <itunes:owner> tags; expected 1`,
        path: [
          ["rss", 0],
          ["channel", 0],
          ["itunes:owner", 0],
        ],
      };

    // Other keys
    const keys = Object.keys(itunesOwnerTag);
    for (const key of keys) {
      if (!ALLOWED_CHILDREN.includes(key))
        return {
          status: "failed",
          error: `Unexpected child: <${key} />`,
          path: [
            ["rss", 0],
            ["channel", 0],
            ["itunes:owner", 0],
            [key, 0],
          ],
        };
    }

    return { status: "passed" };
  },
};
