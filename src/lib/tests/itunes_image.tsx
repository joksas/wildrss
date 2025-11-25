import * as z from "zod";
import type { XML } from "../feed";
import { getUrlExtension } from "../url";
import type { Path, Test, TestArgs, TestOutput } from "./_index";
import { checkTag } from "./_utils";

// Constants
const GIF_WARN_MESSAGE =
  "GIFs take up a large amount of listeners' storage and are not supported on all apps";

export default {
  key: "itunes:image",
  group: "itunes",
  name: <code>&lt;itunes:image&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    outputs.push(
      ..._testImage(
        xml.rss?.at(0)?.channel?.at(0)?.["itunes:image"],
        [
          ["rss", 0],
          ["channel", 0],
        ],
        true,
      ),
    );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      outputs.push(
        ..._testImage(
          item["itunes:image"],
          [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
          ],
          false,
        ),
      );
    }

    let seen = false;

    const filtered_outputs = outputs.filter((output) => {
      if (output.message !== GIF_WARN_MESSAGE) return true;
      if (seen) return false;
      seen = true;
      return true;
    });

    return filtered_outputs;
  },
} satisfies Test;

function _testImage(
  tags: XML[] | undefined,
  path: Path,
  required: boolean,
): TestOutput[] {
  const outputs: TestOutput[] = [];

  outputs.push(
    ...checkTag(tags, "itunes:image", path, {
      limits: required ? { min: 1, max: 1 } : { min: 0, max: 1 },
      attributes: [{ name: "href", type: "required" }],
      children: [],
    }),
  );

  const hrefRaw = tags?.at(0)?.["@attributes"].at(0)?.href;
  if (!hrefRaw) return outputs;

  const newPath: Path = [...path, ["itunes:image", 0]];

  const hrefParsed = z.url().safeParse(hrefRaw);
  if (!hrefParsed.success) {
    outputs.push({
      status: "error",
      message: "Not a URL",
      path: newPath,
    });
    return outputs;
  }

  const href = hrefParsed.data;

  const extension = getUrlExtension(href);
  if (!extension) {
    outputs.push({
      status: "error",
      message: "URL is missing an extension",
      path: newPath,
      attribute: "href",
    });
  }
  if (extension === "gif") {
    outputs.push({
      status: "warn",
      message: GIF_WARN_MESSAGE,
      path: newPath,
      attribute: "href",
    });
  }

  return outputs;
}
