import * as z from "zod";
import type { XML } from "../feed";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag, optionalTagAbsent } from "./_utils";

// Constants
const ALLOWED_PROTOCOLS = ["irc", "xmpp", "nostr", "matrix"] as const;

export default {
  key: "podcast:chat",
  group: "podcast",
  name: <code>&lt;podcast:chat&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const channelPath: Path = [
      ["rss", 0],
      ["channel", 0],
    ];
    const channelChats = xml.rss?.at(0)?.channel?.at(0)?.["podcast:chat"];
    let numChats = channelChats?.length ?? 0;
    outputs.push(..._testChat(channelChats, channelPath));

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const chats = items[i]["podcast:chat"];
      numChats += chats?.length ?? 0;
      outputs.push(..._testChat(chats, [...channelPath, ["item", i]]));
    }

    const liveItems =
      xml.rss?.at(0)?.channel?.at(0)?.["podcast:liveItem"] ?? [];
    for (let i = 0; i < liveItems.length; i++) {
      const chats = liveItems[i]["podcast:chat"];
      numChats += chats?.length ?? 0;
      outputs.push(
        ..._testChat(chats, [...channelPath, ["podcast:liveItem", i]]),
      );
    }

    if (numChats === 0)
      outputs.push(optionalTagAbsent("podcast:chat"));

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
