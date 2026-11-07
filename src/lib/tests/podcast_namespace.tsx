import type { Test, TestArgs } from "./_index";
import { checkNamespace } from "./_namespace";

export default {
  key: "podcast:namespace",
  group: "podcast",
  name: <code>xmlns:podcast</code>,
  test: async ({ xml }: TestArgs) =>
    checkNamespace(xml, {
      label: "Podcast namespace",
      prefix: "podcast",
      uri: "https://podcastindex.org/namespace/1.0",
      aliases: [
        "https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md",
      ],
      absent: "info-optional",
    }),
} satisfies Test;
