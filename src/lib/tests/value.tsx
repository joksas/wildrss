import type { Test, TestArgs } from "./_index";
import { checkTag } from "./_utils";

export const testValue: Test = {
  key: "podcast:value",
  group: "podcast",
  name: <code>&lt;podcast:value&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs = [];

    const podcastValueTags = xml.rss?.at(0)?.channel?.at(0)?.["podcast:value"];
    outputs.push(
      ...checkTag(
        podcastValueTags,
        "podcast:value",
        [
          ["rss", 0],
          ["channel", 0],
        ],
        {
          limits: { min: 0, max: 1, pushOptional: true },
          attributes: [
            { name: "type", type: "required" },
            { name: "method", type: "optional" },
            { name: "suggested", type: "optional" },
          ],
          children: [{ name: "podcast:valueRecipient", min: 1 }],
        },
      ),
    );

    const podcastValueRecipientTags =
      podcastValueTags?.at(0)?.["podcast:valueRecipient"];
    if (podcastValueRecipientTags) {
      outputs.push(
        ...checkTag(
          podcastValueRecipientTags,
          "podcast:valueRecipient",
          [
            ["rss", 0],
            ["channel", 0],
            ["podcast:value", 0],
          ],
          {
            attributes: [
              { name: "name", type: "recommended" },
              {
                name: "customKey",
                type: "optional",
                validator: ({ attributes }) => {
                  const customKey = attributes["customKey"];
                  const customValue = attributes["customValue"];
                  if (customValue && !customKey)
                    return [
                      {
                        status: "error",
                        message: (
                          <>
                            If <code>customValue</code> is provided,{" "}
                            <code>customKey</code> must be specified too
                          </>
                        ),
                      },
                    ];
                  return [];
                },
              },
              {
                name: "customValue",
                type: "optional",

                validator: ({ attributes }) => {
                  const customKey = attributes["customKey"];
                  const customValue = attributes["customValue"];
                  if (customKey && !customValue)
                    return [
                      {
                        status: "error",
                        message: (
                          <>
                            If <code>customKey</code> is provided,{" "}
                            <code>customValue</code> must be specified too
                          </>
                        ),
                      },
                    ];
                  return [];
                },
              },
              {
                name: "type",
                type: "required",
                validator: ({ attributes }) => {
                  const _type = attributes["type"];
                  if (_type === "node")
                    return [
                      {
                        status: "info" as const,
                        message: (
                          <>
                            Lightning addresses are now supported in{" "}
                            <code>
                              {"<"}podcast:valueRecipient{">"}
                            </code>
                            , consider changing to <code>lnaddress</code>
                          </>
                        ),
                      },
                    ];
                  return [];
                },
              },
              { name: "address", type: "required" },
              { name: "split", type: "required" },
              { name: "fee", type: "optional" },
            ],
          },
        ),
      );
    }

    return outputs;
  },
};
