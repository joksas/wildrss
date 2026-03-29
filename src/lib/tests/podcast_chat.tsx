import * as z from "zod";
import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag } from "./_utils";

// Constants
const ALLOWED_PROTOCOLS = ["irc", "xmpp", "nostr", "matrix"] as const;

export default {
  key: "podcast:chat",
  group: "podcast",
  name: <code>&lt;podcast:chat&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    outputs.push(
      ..._testChat(xml.rss?.at(0)?.channel?.at(0)?.["podcast:chat"], [
        ["rss", 0],
        ["channel", 0],
      ]),
    );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      outputs.push(
        ..._testChat(item["podcast:chat"], [
          ["rss", 0],
          ["channel", 0],
          ["item", i],
        ]),
      );
    }

    const live_items =
      xml.rss?.at(0)?.channel?.at(0)?.["podcast:liveItem"] ?? [];
    for (let i = 0; i < live_items.length; i++) {
      const item = live_items[i];
      outputs.push(
        ..._testChat(item["podcast:chat"], [
          ["rss", 0],
          ["channel", 0],
          ["podcast:liveItem", i],
        ]),
      );
    }

    return outputs;
  },
} satisfies Test;

function _testChat(tags: XML[] | undefined, path: Path): TestOutput[] {
  const outputs: TestOutput[] = [];

  outputs.push(
    ...checkTag(tags, "podcast:chat", path, {
      limits: { min: 0, max: 1 },
      attributes: [
        {
          name: "server",
          type: "required",
          schema: z.string().trim().nonempty(),
        },
        {
          name: "protocol",
          type: "required",
          schema: z.enum(ALLOWED_PROTOCOLS),
        },
        {
          name: "accountId",
          type: "recommended",
          schema: z.string().trim().nonempty(),
        },
        {
          name: "space",
          type: "optional",
          schema: z.string().trim().nonempty(),
        },
      ],
      children: [],
    }),
  );

  return outputs;
}
