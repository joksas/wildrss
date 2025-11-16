import { match } from "ts-pattern";
import { getUUIDInfo } from "../string";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag } from "./_utils";

export default {
  key: "podcast:guid",
  group: "podcast",
  name: <code>&lt;podcast:guid&gt;</code>,
  test: async ({ xml }: TestArgs) => {
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
          message: `Should be UUIDv5, found UUID${version}`,
          path: guidPath,
          text: true,
        });
      });

    return outputs;
  },
} satisfies Test;
