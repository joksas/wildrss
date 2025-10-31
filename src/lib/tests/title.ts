import type { Test } from "./_index";

export const testTitle: Test = {
  name: "Title tag",
  test: async (xml) => {
    const titleTag = xml.rss.at(0)?.channel.at(0)?.title.at(0);
    if (!titleTag)
      return {
        status: "failed",
        error: "Missing <title>",
        path: ["rss", "channel"],
      };
    const title = titleTag["@text"];
    if (!title)
      return {
        status: "failed",
        error: "Missing <title> value",
        path: ["rss", "channel", "title"],
      };
    return { status: "passed" };
  },
};
