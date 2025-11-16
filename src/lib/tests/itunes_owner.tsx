import type { Test, TestArgs } from "./_index";
import { checkTag } from "./_utils";

export default {
  key: "itunes:owner",
  group: "itunes",
  name: <code>&lt;itunes:owner&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs = [];

    // itunes:owner
    outputs.push(
      ...checkTag(
        xml.rss?.at(0)?.channel?.at(0)?.["itunes:owner"],
        "itunes:owner",
        [
          ["rss", 0],
          ["channel", 0],
        ],
        {
          limits: { min: 0, max: 1, pushOptional: true },
          attributes: [],
          children: [
            { name: "itunes:name", min: 1, max: 1 },
            { name: "itunes:email", min: 1, max: 1 },
          ],
        },
      ),
    );

    // itunes:name
    outputs.push(
      ...checkTag(
        xml.rss?.at(0)?.channel?.at(0)?.["itunes:owner"]?.at(0)?.[
          "itunes:name"
        ],
        "itunes:name",
        [
          ["rss", 0],
          ["channel", 0],
          ["itunes:owner", 0],
        ],
        {
          attributes: [],
          children: [],
        },
      ),
    );

    // itunes:email
    outputs.push(
      ...checkTag(
        xml.rss?.at(0)?.channel?.at(0)?.["itunes:owner"]?.at(0)?.[
          "itunes:email"
        ],
        "itunes:email",
        [
          ["rss", 0],
          ["channel", 0],
          ["itunes:owner", 0],
        ],
        {
          attributes: [],
          children: [],
        },
      ),
    );

    return outputs;
  },
} satisfies Test;
