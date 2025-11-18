import * as z from "zod";
import type { XML } from "../feed";
import {
  APPLE_PODCASTS_ENCLOSURE_EXTENSIONS,
  checkAllowedMimetype,
} from "../files";
import { getUrlExtension, WebURL } from "../url";
import type { Test, TestArgs, TestOutput } from "./_index";
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

    const live_items =
      xml.rss?.at(0)?.channel?.at(0)?.["podcast:liveItem"] ?? [];
    outputs.push(
      ..._checkEnclosures({
        items: live_items,
        kind: "podcast:liveItem",
      }),
    );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    outputs.push(
      ..._checkEnclosures({
        items,
        kind: "item",
      }),
    );

    return outputs;
  },
} satisfies Test;

function _checkEnclosures({
  items,
  kind,
}: {
  items: XML[];
  kind: "item" | "podcast:liveItem";
}): TestOutput[] {
  const outputs: TestOutput[] = [];

  let numEnclosures = 0;
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const enclosures = item["enclosure"];
    numEnclosures += (enclosures ?? []).length;
    outputs.push(
      ...checkTag(
        enclosures,
        "enclosure",
        [
          ["rss", 0],
          ["channel", 0],
          [kind, idx],
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
              type: kind === "item" ? "required" : "optional",
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

                // Check mimetype
                const allowedRes = checkAllowedMimetype({
                  extension,
                  mimetype,
                });
                if (allowedRes.isErr()) {
                  const allowed = allowedRes.error;
                  outputs.push({
                    status: "error",
                    message: (
                      <>
                        Expected{" "}
                        {allowed.length > 1 ? (
                          <>
                            one of <code>{allowed.join(", ")}</code>
                          </>
                        ) : (
                          <code>{allowed.at(0)}</code>
                        )}{" "}
                        for <code>{extension}</code> extension
                      </>
                    ),
                  });
                }

                // Check Apple Podcasts compatibility
                if (
                  kind === "item" &&
                  !APPLE_PODCASTS_ENCLOSURE_EXTENSIONS.includes(
                    extension as any,
                  )
                ) {
                  outputs.push({
                    status: "warn",
                    message: (
                      <>
                        <code>{extension}</code> files are not supported on
                        Apple Podcasts. You can use one of
                        <code>
                          {APPLE_PODCASTS_ENCLOSURE_EXTENSIONS.join(", ")}
                        </code>
                        .
                      </>
                    ),
                  });
                }

                return outputs;
              },
            },
          ],
          children: [],
        },
      ),
    );
  }

  if (kind === "item" || numEnclosures > 0)
    outputs.push({
      status: "info",
      message: (
        <>
          Found {numEnclosures}{" "}
          <code>
            {"<"}
            {kind}
            {">"}
          </code>{" "}
          {numEnclosures === 1 ? "enclosure" : "enclosures"}
        </>
      ),
    });

  return outputs;
}
