import * as z from "zod";
import type { XML } from "../feed";
import { urlHasExtension } from "../url";
import type { Test, TestArgs, TestOutput } from "./_index";

export const testItunesImage: Test = {
  key: "itunes:image",
  name: <code>&lt;itunes:image&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const outputs: TestOutput[] = [];

    const feedItunesImageTags = xml.rss?.at(0)?.channel?.at(0)?.[
      "itunes:image"
    ];
    if (!feedItunesImageTags || feedItunesImageTags.length !== 1)
      outputs.push({
        status: "error",
        message: `Found ${(feedItunesImageTags ?? []).length} <itunes:image> tags; expected 1`,
        path: [
          ["rss", 0],
          ["channel", 0],
        ],
      });

    const feedItunesImageTag = feedItunesImageTags?.at(0);
    if (feedItunesImageTag)
      outputs.push(
        ..._testImage(
          [
            ["rss", 0],
            ["channel", 0],
            ["itunes:image", 0],
          ],
          feedItunesImageTag,
        ),
      );

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemItunesImageTags = item["itunes:image"];
      const itemItunesImageTag = itemItunesImageTags?.at(0);
      if (!itemItunesImageTag) continue;
      if (itemItunesImageTags && itemItunesImageTags.length > 1)
        outputs.push({
          status: "error",
          message: `Found ${(itemItunesImageTags ?? []).length} <itunes:image> tags; expected 1`,
          path: [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
          ],
        });
      outputs.push(
        ..._testImage(
          [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
            ["itunes:image", 0],
          ],
          itemItunesImageTag,
        ),
      );
    }

    return outputs;
  },
};

function _testImage(path: [string, number][], tag: XML): TestOutput[] {
  const href = tag?.["@attributes"].at(0)?.href;
  if (!href)
    return [
      {
        status: "error",
        message: "Missing <code>href</code> attribute",
        path,
      },
    ];
  const hrefParsed = z.url().safeParse(href);
  if (!hrefParsed.success) {
    return [
      {
        status: "error",
        message: "Not a URL",
        path,
      },
    ];
  }

  const outputs: TestOutput[] = [];

  if (!urlHasExtension(hrefParsed.data)) {
    outputs.push(
      {
        status: "error",
        message: "URL is missing an extension",
        path,
        attribute: "href",
      },
    );
  }


  return outputs;
}
