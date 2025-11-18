import * as z from "zod";
import type { XML } from "../feed";
import { isWebURL } from "../url";
import type { Test, TestArgs, TestOutput } from "./_index";
import { checkTag, type MinimalTestOutput } from "./_utils";

export default {
  key: "guid",
  group: "rss",
  name: <code>&lt;guid&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const channelGUIDs = xml.rss?.at(0)?.channel?.at(0)?.guid;
    outputs.push(
      ...checkTag(
        channelGUIDs,
        "guid",
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

    const allGUIDs: Record<
      string,
      { kind: "item" | "podcast:liveItem"; idx: number }[]
    > = {};

    const live_items =
      xml.rss?.at(0)?.channel?.at(0)?.["podcast:liveItem"] ?? [];
    outputs.push(
      ..._checkGUIDs({
        items: live_items,
        kind: "podcast:liveItem",
        allGUIDs: allGUIDs,
      }),
    );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    outputs.push(
      ..._checkGUIDs({
        items,
        kind: "item",
        allGUIDs,
      }),
    );

    for (const [guid, instances] of Object.entries(allGUIDs)) {
      if (instances.length <= 1) continue;
      outputs.push({
        status: "error",
        message: (
          <>
            Found {instances.length} instances of GUID <code>{guid}</code>
          </>
        ),
        paths: instances.map(({ kind, idx }) => [
          ["rss", 0],
          ["channel", 0],
          [kind, idx],
        ]),
      });
    }

    return outputs;
  },
} satisfies Test;

function _checkGUIDs({
  items,
  kind,
  allGUIDs,
}: {
  items: XML[];
  kind: "item" | "podcast:liveItem";
  allGUIDs: Record<
    string,
    { kind: "item" | "podcast:liveItem"; idx: number }[]
  >;
}): TestOutput[] {
  const outputs: TestOutput[] = [];

  let numGUIDs = 0;
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const guids = item.guid;

    numGUIDs += (guids ?? []).length;
    const guidValues = (guids ?? [])
      .map((guid) => guid["@text"])
      .filter((guid) => !!guid) as string[];
    for (const guid of guidValues) {
      if (allGUIDs[guid]) {
        allGUIDs[guid] = [...allGUIDs[guid], { kind, idx }];
      } else {
        allGUIDs[guid] = [{ kind, idx }];
      }
    }

    outputs.push(
      ...checkTag(
        guids,
        "guid",
        [
          ["rss", 0],
          ["channel", 0],
          [kind, idx],
        ],
        {
          limits: { min: 1, max: 1 },
          attributes: [
            {
              name: "isPermaLink",
              type: "optional",
              validator: ({ attributes, text }) => {
                const outputs: MinimalTestOutput[] = [];

                const isPermaLink = attributes.isPermaLink;
                const permalinkRes = z
                  .stringbool({ truthy: ["true"], falsy: ["false"] })
                  .optional()
                  .safeParse(isPermaLink);
                if (permalinkRes.error) {
                  outputs.push({
                    status: "error",
                    message: permalinkRes.error,
                  });
                } else {
                  const isURL = isWebURL(text ?? "");
                  if (!isURL && permalinkRes.data !== false) {
                    outputs.push({
                      status: "error",
                      message: (
                        <>
                          If GUID is not a URL, <code>isPermaLink</code> must be{" "}
                          <code>false</code>
                        </>
                      ),
                    });
                  }
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

  if (kind === "item" || numGUIDs > 0)
    outputs.push({
      status: "info",
      message: (
        <>
          Found {numGUIDs}{" "}
          <code>
            {"<"}
            {kind}
            {">"}
          </code>{" "}
          {numGUIDs === 1 ? "GUID" : "GUIDs"}
        </>
      ),
    });

  return outputs;
}
