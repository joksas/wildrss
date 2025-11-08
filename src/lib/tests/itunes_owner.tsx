import type { Test, TestArgs, TestOutput } from "./_index";

const ALLOWED_CHILDREN = ["itunes:name", "itunes:email"];
export const testItunesOwner: Test = {
  key: "itunes:owner",
  name: <code>&lt;itunes:owner&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    // itunes:owner
    const itunesOwnerTags = xml.rss?.at(0)?.channel?.at(0)?.["itunes:owner"];
    const itunesOwnerTag = itunesOwnerTags?.at(0);
    if (!itunesOwnerTag) return [];
    if (itunesOwnerTags && itunesOwnerTags?.length > 1)
      outputs.push({
        status: "error",
        message: `Found ${itunesOwnerTags.length} <itunes:owner> tags; expected 1`,
        path: [
          ["rss", 0],
          ["channel", 0],
          ["itunes:owner", 0],
        ],
      });

    // Other keys
    const keys = Object.keys(itunesOwnerTag);
    for (const key of keys) {
      if (!ALLOWED_CHILDREN.includes(key))
        outputs.push({
          status: "error",
          message: `Unexpected child: <${key} />`,
          path: [
            ["rss", 0],
            ["channel", 0],
            ["itunes:owner", 0],
            [key, 0],
          ],
        });
    }

    return outputs;
  },
};
