import type { Test, TestArgs } from "./_index";

// Constants
const TIME_MS_WARN = 500;
const TIME_MS_GOOD = 200;

export default {
  key: "fetching",
  group: "basic",
  name: "Fetching RSS feed",
  test: async ({ fetching_info: { success, time_ms } }: TestArgs) => {
    if (!success) {
      return [
        {
          status: "error",
          message: "We were unable to fetch the feed",
        },
      ];
    }
    if (time_ms > TIME_MS_WARN)
      return [
        {
          status: "warn",
          message: `Feed fetching took ${time_ms}ms; for optimal results aim to keep it under 500ms`,
        },
      ];

    if (time_ms > TIME_MS_GOOD)
      return [
        {
          status: "info",
          message: `The feed was fetched in ${time_ms}ms`,
        },
      ];

    return [
      {
        status: "info",
        message: `The feed was fetched in ${time_ms}ms - that's fast!`,
      },
    ];
  },
} satisfies Test;
