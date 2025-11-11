import type { Test, TestArgs } from "./_index";

export const testTitle: Test = {
  key: "title",
  group: "rss",
  name: <code>&lt;title&gt;</code>,
  test: async ({ xml }: TestArgs) => {
    const titleTag = xml.rss?.at(0)?.channel?.at(0)?.title?.at(0);
    if (!titleTag)
      return [
        {
          status: "error",
          message: "Missing <title>",
          path: [
            ["rss", 0],
            ["channel", 0],
          ],
        },
      ];
    const title = titleTag["@text"];
    if (!title)
      return [
        {
          status: "error",
          message: "Missing <title> value",
          path: [
            ["rss", 0],
            ["channel", 0],
            ["title", 0],
          ],
        },
      ];
    return [];
  },
};
