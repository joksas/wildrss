import * as z from "zod";
import type { XML } from "../feed";
import { urlHasExtension } from "../url";
import type { Test, TestArgs, TestOutput } from "./_index";

export const testItunesImage: Test = {
  key: "itunes:image",
  name: <code>&lt;itunes:image&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const feedItunesImageTags = xml.rss?.at(0)?.channel?.at(0)?.[
      "itunes:image"
    ];
    if (!feedItunesImageTags || feedItunesImageTags.length !== 1)
      return {
        status: "failed",
        error: `Found ${(feedItunesImageTags ?? []).length} <itunes:image> tags; expected 1`,
        path: [
          ["rss", 0],
          ["channel", 0],
        ],
      };
    const feedItunesImageTag = feedItunesImageTags[0];

    const feedRes = _testImage(
      [
        ["rss", 0],
        ["channel", 0],
        ["itunes:image", 0],
      ],
      feedItunesImageTag,
    );
    if (feedRes.status !== "passed") return feedRes;

    const items = xml.rss?.at(0)?.channel?.at(0)?.item ?? [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemItunesImageTags = item["itunes:image"];
      const itemItunesImageTag = itemItunesImageTags?.at(0);
      if (!itemItunesImageTag) continue;
      if (itemItunesImageTags && itemItunesImageTags.length > 1)
        return {
          status: "failed",
          error: `Found ${(itemItunesImageTags ?? []).length} <itunes:image> tags; expected 1`,
          path: [
            ["rss", 0],
            ["channel", 0],
            ["item", i],
          ],
        };
      const itemRes = _testImage(
        [
          ["rss", 0],
          ["channel", 0],
          ["item", i],
          ["itunes:image", 0],
        ],
        itemItunesImageTag,
      );
      if (itemRes.status !== "passed") return itemRes;
    }

    return { status: "passed" };
  },
};

function _testImage(path: [string, number][], tag: XML): TestOutput {
  const href = tag?.["@attributes"].at(0)?.href;
  if (!href)
    return {
      status: "failed",
      error: "Missing `href` attribute",
      path,
    };
  const hrefParsed = z.url().safeParse(href);
  if (!hrefParsed.success) {
    return {
      status: "failed",
      error: "Not a URL",
      path,
    };
  }
  if (!urlHasExtension(hrefParsed.data)) {
    return {
      status: "failed",
      error: "URL is missing an extension",
      path,
    };
  }

  return { status: "passed" };
}
