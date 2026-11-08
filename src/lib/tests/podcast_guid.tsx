import { match } from "ts-pattern";
import { derivePodcastGUID, getUUIDInfo } from "../string";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag } from "./_utils";

export default {
  key: "podcast:guid",
  group: "podcast",
  name: <code>&lt;podcast:guid&gt;</code>,
  test: async ({ xml, feed_url }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const basePath: Path = [
      ["rss", 0],
      ["channel", 0],
    ];

    const podcastGUIDTags = xml.rss?.at(0)?.channel?.at(0)?.["podcast:guid"];
    outputs.push(
      ...checkTag(podcastGUIDTags, "podcast:guid", basePath, {
        limits: { min: 0, max: 1, pushOptional: true },
        attributes: [],
        children: [],
      }),
    );

    const guid = podcastGUIDTags?.at(0)?.["@text"];
    if (guid === undefined) return outputs;

    const guidPath: Path = [...basePath, ["podcast:guid", 0]];
    const uuidInfo = getUUIDInfo(guid);
    match(uuidInfo)
      .with("v5", () => {
        outputs.push({
          status: "info",
          message: (
            <>
              Found GUID value of <code>{guid}</code>
            </>
          ),
          path: guidPath,
          text: true,
        });
      })
      .with(undefined, () => {
        outputs.push({
          status: "error",
          message: "Should be UUID",
          path: guidPath,
          text: true,
        });
      })
      .otherwise((version) => {
        outputs.push({
          status: "warn",
          message: "Should be UUIDv5",
          note: `found UUID${version}`,
          path: guidPath,
          text: true,
        });
      });

    if (uuidInfo !== "v5") return outputs;

    // A feed that moved keeps the GUID derived from its original URL, so a mismatch is informational only
    const derivedGUID = await derivePodcastGUID(feed_url);
    if (derivedGUID === guid.trim().toLowerCase()) {
      outputs.push({
        status: "info",
        message: "GUID matches the value derived from this feed's URL",
        path: guidPath,
        text: true,
      });
    } else {
      outputs.push({
        status: "info",
        message: (
          <>
            GUID differs from the value derived from this feed's URL (
            <code>{derivedGUID}</code>). This is expected if the feed has moved:
            the GUID is derived once from the original feed URL and must stay
            unchanged afterwards
          </>
        ),
        path: guidPath,
        text: true,
      });
    }

    return outputs;
  },
} satisfies Test;
