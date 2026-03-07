import * as z from "zod";
import type { Test, TestArgs, TestOutput } from "./_index";
import { checkTag, type MinimalTestOutput } from "./_utils";

// Constants
const LIVE_STATUSES = ["pending", "live", "ended"] as const;
const DATETIME_SCHEMA = z
  .string()
  .transform((input) => normalizeBasicOffset(input))
  .pipe(z.iso.datetime({ offset: true }));

const normalizeBasicOffset = (value: string): string => {
  // Matches ...±HHMM at the end, but not already with a colon
  const match = value.match(/(Z|[+-]\d{2}:\d{2}|[+-]\d{4})$/);
  if (!match) return value; // no offset → let zod complain if offset is required

  const suffix = match[1];

  // Already Z or extended offset, nothing to do
  if (suffix === "Z" || /^[+-]\d{2}:\d{2}$/.test(suffix)) {
    return value;
  }

  // suffix is basic offset like +0500 / -1130
  const sign = suffix[0];
  const hours = suffix.slice(1, 3);
  const minutes = suffix.slice(3, 5);
  const extended = `${sign}${hours}:${minutes}`;

  return value.slice(0, -suffix.length) + extended;
};

export default {
  key: "podcast:liveItem",
  group: "podcast",
  name: <code>&lt;podcast:liveItem&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const liveItems =
      xml.rss?.at(0)?.channel?.at(0)?.["podcast:liveItem"] ?? [];
    outputs.push(
      ...checkTag(
        liveItems,
        "podcast:liveItem",
        [
          ["rss", 0],
          ["channel", 0],
        ],
        {
          limits: { min: 0, pushOptional: true },
          attributes: [
            {
              name: "status",
              type: "required",
              schema: z.enum(LIVE_STATUSES),
            },
            {
              name: "start",
              type: "required",
              schema: DATETIME_SCHEMA,
              validator: ({ attributes }) => {
                const outputs: MinimalTestOutput[] = [];

                const start = DATETIME_SCHEMA.transform(
                  (s) => new Date(s),
                ).safeParse(attributes["start"]).data;
                if (!start) return [];
                const pending = attributes["status"] === "pending";
                if (!pending) return [];

                const now = Date.now();
                const diff_seconds = Math.round((start.getTime() - now) / 1000);
                if (diff_seconds < -24 * 3600)
                  outputs.push({
                    status: "warn",
                    message: `Start time of a pending livestream should not be more than 24 hours in the past - found ${new Intl.DateTimeFormat(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        timeZoneName: "shortGeneric",
                      },
                    ).format(start)}`,
                  });

                return outputs;
              },
            },
            {
              name: "end",
              type: "recommended",
              schema: DATETIME_SCHEMA,
              validator: ({ attributes }) => {
                const outputs: MinimalTestOutput[] = [];

                const start = DATETIME_SCHEMA.transform(
                  (s) => new Date(s),
                ).safeParse(attributes["start"]).data;
                const end = DATETIME_SCHEMA.transform(
                  (s) => new Date(s),
                ).safeParse(attributes["end"]).data;
                if (!start || !end) return [];

                const endAfterStart = end.getTime() > start.getTime();
                if (!endAfterStart)
                  outputs.push({
                    status: "warn",
                    message: "End time must be greater than start time",
                  });

                return outputs;
              },
            },
          ],
        },
      ),
    );
    if (liveItems.length === 0) return outputs;

    for (const status of LIVE_STATUSES) {
      const filteredLiveItems = liveItems
        .map((item, idx) => ({ item, idx }))
        .filter(({ item }) => item["@attributes"]?.[0].status === status);
      outputs.push({
        status: "info",
        message: (
          <>
            Found {filteredLiveItems.length}{" "}
            <code>
              {"<"}podcast:liveItem{">"}
            </code>{" "}
            {filteredLiveItems.length === 1 ? "tag" : "tags"} with status{" "}
            <code>{status}</code>
          </>
        ),
        paths: filteredLiveItems.map(({ idx }) => [
          ["rss", 0],
          ["channel", 0],
          ["podcast:liveItem", idx],
        ]),
      });
    }

    return outputs;
  },
} satisfies Test;
