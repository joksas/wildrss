import type { Test } from "./_index";

export const testValue: Test = {
  name: "podcast:value tag",
  test: async (xml) => {
    const valueTag = xml.rss.at(0)?.channel.at(0)?.["podcast:value"].at(0);
    if (!valueTag)
      return {
        status: "failed",
        error: "Missing <podcast:value>",
        path: ["rss", "channel", "podcast:value"],
      };
    return { status: "passed" };
  },
};
