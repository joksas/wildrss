import type { Test, TestArgs } from "./_index";
import { checkNamespace } from "./_namespace";

export default {
  key: "itunes:namespace",
  group: "itunes",
  name: <code>xmlns:itunes</code>,
  test: async ({ xml }: TestArgs) =>
    checkNamespace(xml, {
      label: "Apple Podcasts namespace",
      prefix: "itunes",
      uri: "http://www.itunes.com/dtds/podcast-1.0.dtd",
      aliases: [],
      absent: "warn",
    }),
} satisfies Test;
