import type { Test, TestArgs, TestOutput } from "./_index";
import {
  CHANNEL_PATH,
  checkHypertextURL,
  checkLanguageTag,
  checkMisplacedInChannel,
  checkTag,
  getParents,
  type MinimalTestOutput,
  mergeRepeatedOutputs,
  optionalTagAbsent,
} from "./_utils";

// Constants
const TRANSCRIPT_TYPES = [
  "text/plain",
  "text/html",
  "text/vtt",
  "application/json",
  "application/x-subrip",
] as const;
const TRANSCRIPT_TYPE_CORRECTIONS: Record<string, string> = {
  "application/srt": "application/x-subrip",
  "text/srt": "application/x-subrip",
  "text/x-subrip": "application/x-subrip",
  "application/x-srt": "application/x-subrip",
  "application/vtt": "text/vtt",
  "text/json": "application/json",
};
const CAPTIONS_REL = "captions";

export default {
  key: "podcast:transcript",
  group: "podcast",
  name: <code>&lt;podcast:transcript&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = checkMisplacedInChannel(
      xml,
      "podcast:transcript",
    );

    const parents = getParents(xml, ["item", "podcast:liveItem"]);
    let numTranscripts = 0;
    let numParentsWithTranscripts = 0;
    for (const { tag, path } of parents) {
      const transcripts = tag["podcast:transcript"];
      numTranscripts += transcripts?.length ?? 0;
      numParentsWithTranscripts += transcripts ? 1 : 0;
      outputs.push(
        ...checkTag(transcripts, "podcast:transcript", path, {
          attributes: [
            {
              name: "url",
              type: "required",
              validator: ({ attributes }) => checkHypertextURL(attributes.url),
            },
            {
              name: "type",
              type: "required",
              validator: ({ attributes }) => _checkType(attributes.type),
            },
            {
              name: "language",
              type: "optional",
              validator: ({ attributes }) =>
                checkLanguageTag(attributes.language),
            },
            {
              name: "rel",
              type: "optional",
              validator: ({ attributes }) => _checkRel(attributes.rel),
            },
          ],
          children: [],
        }),
      );
    }

    if (numTranscripts === 0)
      return [
        ...outputs,
        optionalTagAbsent("podcast:transcript", CHANNEL_PATH),
      ];

    outputs.push({
      status: "info",
      message: (
        <>
          Found {numTranscripts}{" "}
          <code>
            {"<"}podcast:transcript{">"}
          </code>{" "}
          {numTranscripts === 1 ? "tag" : "tags"} in{" "}
          {numParentsWithTranscripts} of {parents.length}{" "}
          {parents.length === 1 ? "episode" : "episodes"}
        </>
      ),
    });

    return mergeRepeatedOutputs(outputs);
  },
} satisfies Test;

function _checkType(value: string | undefined): MinimalTestOutput[] {
  if (value === undefined) return [];
  const type = value.trim().toLowerCase();
  if ((TRANSCRIPT_TYPES as readonly string[]).includes(type)) return [];

  const correction = TRANSCRIPT_TYPE_CORRECTIONS[type];
  return [
    {
      status: "warn",
      message: correction ? (
        <>
          Expected <code>{correction}</code> - found <code>{value}</code>
        </>
      ) : (
        <>
          Expected one of <code>{TRANSCRIPT_TYPES.join(", ")}</code> - found{" "}
          <code>{value}</code>
        </>
      ),
    },
  ];
}

function _checkRel(value: string | undefined): MinimalTestOutput[] {
  if (value === undefined || value.trim() === CAPTIONS_REL) return [];
  return [
    {
      status: "warn",
      message: (
        <>
          Expected <code>{CAPTIONS_REL}</code> - found <code>{value}</code>.
          Apps will likely ignore this value
        </>
      ),
    },
  ];
}
