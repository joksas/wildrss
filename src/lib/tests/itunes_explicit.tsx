import * as z from "zod";
import type { Test, TestArgs } from "./_index";
import { checkTag, type MinimalTestOutput } from "./_utils";

export default {
  key: "explicit",
  group: "itunes",
  name: <code>&lt;itunes:explicit&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs = [];

    const channelExplicit = xml.rss?.at(0)?.channel?.at(0)?.["itunes:explicit"];
    outputs.push(
      ...checkTag(
        channelExplicit,
        "itunes:explicit",
        [
          ["rss", 0],
          ["channel", 0],
        ],
        {
          limits: { min: 1, max: 1 },
          attributes: [],
          children: [],
          text: {
            validator: ({ text }) => {
              const outputs: MinimalTestOutput[] = [];

              const res = z
                .stringbool({ truthy: ["true"], falsy: ["false"] })
                .safeParse(text);
              if (res.error) {
                outputs.push({ status: "error", message: res.error });
              } else {
                const explicit = res.data;
                outputs.push({
                  status: "info",
                  message: explicit
                    ? "Feed is marked as containing explicit content"
                    : "Feed is marked as not containing explicit content",
                });
              }

              return outputs;
            },
          },
        },
      ),
    );

    return outputs;
  },
} satisfies Test;
