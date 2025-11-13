import type { Test, TestArgs } from "./_index";
import { checkTag } from "./_utils";

export const testValue: Test = {
  key: "podcast:value",
  group: "podcast",
  name: <code>&lt;podcast:value&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs = [];

    outputs.push(
      ...checkTag(
        xml.rss?.at(0)?.channel?.at(0)?.["podcast:value"],
        "podcast:value",
        [
          ["rss", 0],
          ["channel", 0],
        ],
        {
          limits: { min: 0, max: 1, pushOptional: true },
          attributes: [
            { name: "type", required: true },
            { name: "method", required: false },
            { name: "suggested", required: false },
          ],
          children: [{ name: "podcast:valueRecipient", min: 1 }],
        },
      ),
    );
    return outputs;
  },
};
