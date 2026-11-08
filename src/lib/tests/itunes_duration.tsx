import { parseDuration } from "../duration";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag, type MinimalTestOutput } from "./_utils";

// Constants
const SEXAGESIMAL_LIMIT = 60;

export default {
  key: "itunes:duration",
  group: "itunes",
  name: <code>&lt;itunes:duration&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const channelPath: Path = [
      ["rss", 0],
      ["channel", 0],
    ];
    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];

    let numDurations = 0;
    let numClockFormat = 0;
    for (let i = 0; i < items.length; i++) {
      const itemPath: Path = [...channelPath, ["item", i]];
      const durations = items[i]["itunes:duration"];
      numDurations += durations ? 1 : 0;

      if (!durations) {
        outputs.push({
          status: "warn",
          message: (
            <>
              Missing{" "}
              <code>
                {"<"}itunes:duration{">"}
              </code>{" "}
              - apps may not show the episode length until it is downloaded
            </>
          ),
          path: itemPath,
        });
        continue;
      }

      if (durations.at(0)?.["@text"]?.includes(":")) numClockFormat++;
      outputs.push(
        ...checkTag(durations, "itunes:duration", itemPath, {
          limits: { min: 0, max: 1 },
          attributes: [],
          children: [],
          text: { validator: ({ text }) => _checkDurationText(text) },
        }),
      );
    }

    if (numClockFormat > 0)
      outputs.push({
        status: "info",
        message: (
          <>
            {numClockFormat} {numClockFormat === 1 ? "duration uses" : "durations use"}{" "}
            <code>HH:MM:SS</code> format - Apple recommends giving the duration
            in seconds
          </>
        ),
      });

    const liveItems =
      xml.rss?.at(0)?.channel?.at(0)?.["podcast:liveItem"] ?? [];
    for (let i = 0; i < liveItems.length; i++) {
      if (!liveItems[i]["itunes:duration"]) continue;
      outputs.push({
        status: "info",
        message:
          "A livestream has no fixed duration, so apps will likely ignore this value",
        path: [
          ...channelPath,
          ["podcast:liveItem", i],
          ["itunes:duration", 0],
        ],
      });
    }

    outputs.push({
      status: "info",
      message: (
        <>
          Found {numDurations} of {items.length}{" "}
          <code>
            {"<"}item{">"}
          </code>{" "}
          {items.length === 1 ? "tag" : "tags"} with a duration
        </>
      ),
    });

    return outputs;
  },
} satisfies Test;

function _checkDurationText(text: string | undefined): MinimalTestOutput[] {
  const raw = text?.trim() ?? "";
  if (raw === "") return [{ status: "error", message: "Duration is empty" }];

  const seconds = parseDuration(raw);
  if (seconds === undefined)
    return [
      {
        status: "error",
        message: (
          <>
            Expected seconds (e.g. <code>1830</code>) or <code>HH:MM:SS</code>
          </>
        ),
      },
    ];

  const outputs: MinimalTestOutput[] = [];
  const [, ...subunits] = raw.split(":");
  if (subunits.some((part) => Number(part) >= SEXAGESIMAL_LIMIT))
    outputs.push({
      status: "warn",
      message: `Minutes and seconds should be below ${SEXAGESIMAL_LIMIT}`,
    });
  if (seconds === 0)
    outputs.push({ status: "warn", message: "Duration is 0 seconds" });

  return outputs;
}
