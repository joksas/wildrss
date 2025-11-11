import type { Test, TestArgs, TestOutput } from "./_index";

// Constants
const FEED_DESCRIPTION_LIMIT = 4_000;
const ITEM_DESCRIPTION_LIMIT = 10_000;

export default {
  key: "description" as const,
  group: "rss",
  name: <code>&lt;description&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const descriptionTag = xml.rss?.at(0)?.channel?.at(0)?.description?.at(0);
    if (!descriptionTag) {
      outputs.push({
        status: "error",
        message: "Missing <description>",
        path: [
          ["rss", 0],
          ["channel", 0],
        ],
      });
    } else {
      const description = descriptionTag["@text"];
      if (!description) {
        outputs.push({
          status: "error",
          message: "Missing <description> value",
          path: [
            ["rss", 0],
            ["channel", 0],
            ["description", 0],
          ],
        });
      } else {
        if (description.length > FEED_DESCRIPTION_LIMIT) {
          outputs.push({
            status: "error",
            message: `Description value cannot exceed ${FEED_DESCRIPTION_LIMIT} characters - found ${description.length}`,
            path: [
              ["rss", 0],
              ["channel", 0],
              ["description", 0],
            ],
          });
        }
      }
    }
    return outputs;
  },
} satisfies Test;
