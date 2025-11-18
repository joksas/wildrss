import * as z from "zod";
import { getUrlExtension, WebURL } from "../url";
import type { Test, TestArgs } from "./_index";
import { checkTag, type MinimalTestOutput } from "./_utils";

export default {
  key: "enclosure",
  group: "rss",
  name: <code>&lt;enclosure&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs = [];

    const channelEnclosures = xml.rss?.at(0)?.channel?.at(0)?.["enclosure"];
    outputs.push(
      ...checkTag(
        channelEnclosures,
        "enclosure",
        [
          ["rss", 0],
          ["channel", 0],
        ],
        {
          limits: { min: 0, max: 0 },
          attributes: [],
          children: [],
        },
      ),
    );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemEnclosures = item["enclosure"];
      outputs.push(
        ...checkTag(
          itemEnclosures,
          "enclosure",
          [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
          ],
          {
            limits: { min: 1, max: 1 },
            attributes: [
              {
                name: "url",
                type: "required",
                validator: ({ attributes }) => {
                  const outputs: MinimalTestOutput[] = [];

                  const url = attributes["url"];
                  if (!url) return [];

                  const error = WebURL.safeParse(url).error;
                  if (error) outputs.push({ status: "error", message: error });

                  return outputs;
                },
              },
              {
                name: "length",
                type: "required",
                validator: ({ attributes }) => {
                  const outputs: MinimalTestOutput[] = [];

                  const length = attributes["length"];
                  if (length === undefined) return [];

                  const error = z.coerce
                    .number()
                    .int()
                    .positive()
                    .safeParse(length).error;
                  if (error) outputs.push({ status: "error", message: error });

                  return outputs;
                },
              },
              {
                name: "type",
                type: "required",
                validator: ({ attributes }) => {
                  const outputs: MinimalTestOutput[] = [];

                  const url = attributes.url;
                  const mimetype = attributes.type;
                  if (!url || !mimetype) return [];

                  const extension = getUrlExtension(url);
                  if (!extension) return [];

                  const mp3Mimetype = "audio/mpeg";
                  if (extension === "mp3" && mimetype !== mp3Mimetype)
                    outputs.push({
                      status: "error",
                      message: (
                        <>
                          Expected <code>{mp3Mimetype}</code> for {extension}{" "}
                          extension
                        </>
                      ),
                    });

                  return outputs;
                },
              },
            ],
            children: [],
          },
        ),
      );
    }

    return outputs;
  },
} satisfies Test;
