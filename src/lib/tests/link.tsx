import type { Test, TestArgs } from "./_index";
import { checkTag } from "./_utils";

export default {
  key: "link",
  group: "rss",
  name: <code>&lt;link&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs = [];

    outputs.push(
      ...checkTag(
        xml.rss?.at(0)?.channel?.at(0)?.["link"],
        "link",
        [
          ["rss", 0],
          ["channel", 0],
        ],
        {
          limits: { min: 0, max: 1, pushOptional: true },
          attributes: [],
          children: [],
        },
      ),
    );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      outputs.push(
        ...checkTag(
          item["link"],
          "link",
          [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
          ],
          {
            limits: { min: 0, max: 1 },
            attributes: [],
            children: [],
          },
        ),
      );
    }

    return outputs;
  },
} satisfies Test;
