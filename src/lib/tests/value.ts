import type { Test, TestArgs } from "./_index";

export const testValue: Test = {
  name: "podcast:value tag",
  test: async ({ xml }: TestArgs) => {
    const valueTag = xml.rss?.at(0)?.channel?.at(0)?.["podcast:value"]?.at(0);
    if (!valueTag)
      return {
        status: "failed",
        error: "Missing <podcast:value>",
        path: [
          ["rss", 0],
          ["channel", 0],
        ],
      };
    return { status: "passed" };
  },
};
