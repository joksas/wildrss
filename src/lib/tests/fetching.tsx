import type { Test, TestArgs } from "./_index";

// Constants
const TIME_MS_WARN = 1000;
const TIME_MS_GOOD = 200;

export default {
  key: "fetching",
  group: "basic",
  name: "Downloading RSS feed",
  test: async ({ fetching_info: { success, time_ms } }: TestArgs) => {
    if (!success) {
      return [
        {
          status: "error",
          message: "We were unable to download the feed",
        },
      ];
    }
    if (time_ms > TIME_MS_WARN)
      return [
        {
          status: "warn",
          message: `Download took ${time_ms}ms; for optimal results aim to keep it under 500ms`,
        },
      ];

    if (time_ms > TIME_MS_GOOD)
      return [
        {
          status: "info",
          message: `Downloaded in ${time_ms}ms`,
        },
      ];

    return [
      {
        status: "info",
        message: `Downloaded in ${time_ms}ms - that's fast!`,
      },
    ];
  },
} satisfies Test;
