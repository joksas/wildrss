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
        message: (
          <>
            Missing <code>&lt;description&gt;</code>
          </>
        ),
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
          message: (
            <>
              Missing <code>description</code> value
            </>
          ),
          path: [
            ["rss", 0],
            ["channel", 0],
            ["description", 0],
          ],
          text: true,
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
            text: true,
          });
        }
      }
    }

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const descriptionTag = item.description?.at(0);
      if (!descriptionTag) {
        outputs.push({
          status: "warn",
          message: (
            <>
              Missing <code>&lt;description&gt;</code>
            </>
          ),
          path: [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
          ],
        });
      } else {
        const description = descriptionTag["@text"];
        if (!description) {
          outputs.push({
            status: "error",
            message: (
              <>
                Missing{" "}
                <code>
                  {"<"}description{">"}
                </code>{" "}
                value
              </>
            ),
            path: [
              ["rss", 0],
              ["channel", 0],
              ["item", i],
              ["description", 0],
            ],
          });
        } else {
          if (description.length > ITEM_DESCRIPTION_LIMIT) {
            outputs.push({
              status: "error",
              message: `Description value cannot exceed ${ITEM_DESCRIPTION_LIMIT} characters - found ${description.length}`,
              path: [
                ["rss", 0],
                ["channel", 0],
                ["item", i],
                ["description", 0],
              ],
              text: true,
            });
          }
        }
      }
    }

    return outputs;
  },
} satisfies Test;
