import type { Test, TestArgs, TestOutput } from "./_index";
import {
  CHANNEL_PATH,
  checkHypertextURL,
  checkMisplacedInChannel,
  checkTag,
  getParents,
  type MinimalTestOutput,
  optionalTagAbsent,
} from "./_utils";

// Constants
const CHAPTERS_TYPE = "application/json+chapters";

export default {
  key: "podcast:chapters",
  group: "podcast",
  name: <code>&lt;podcast:chapters&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = checkMisplacedInChannel(
      xml,
      "podcast:chapters",
    );

    const parents = getParents(xml, ["item", "podcast:liveItem"]);
    let numParentsWithChapters = 0;
    for (const { tag, path } of parents) {
      const chapters = tag["podcast:chapters"];
      numParentsWithChapters += chapters ? 1 : 0;
      outputs.push(
        ...checkTag(chapters, "podcast:chapters", path, {
          limits: { min: 0, max: 1 },
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
          ],
          children: [],
        }),
      );
    }

    if (numParentsWithChapters === 0)
      return [...outputs, optionalTagAbsent("podcast:chapters", CHANNEL_PATH)];

    outputs.push({
      status: "info",
      message: (
        <>
          Found chapters in {numParentsWithChapters} of {parents.length}{" "}
          {parents.length === 1 ? "episode" : "episodes"}
        </>
      ),
    });

    return outputs;
  },
} satisfies Test;

function _checkType(value: string | undefined): MinimalTestOutput[] {
  if (value === undefined || value.trim().toLowerCase() === CHAPTERS_TYPE)
    return [];
  return [
    {
      status: "warn",
      message: (
        <>
          Expected <code>{CHAPTERS_TYPE}</code> - found <code>{value}</code>.
          The specification names this type for JSON chapter files
        </>
      ),
    },
  ];
}
