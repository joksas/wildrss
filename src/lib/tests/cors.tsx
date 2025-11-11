import type { Test, TestArgs } from "./_index";

export const testCORS: Test = {
  key: "permissive-cors",
  group: "basic",
  name: "Permissive CORS",
  test: async ({ required_server }: TestArgs) => {
    if (required_server)
      return [
        {
          status: "error",
          message: (
            <>
              Feed HTTP response is likely missing{" "}
              <code>Access-Control-Allow-Origin</code> header with value of{" "}
              <code>*</code>. Webpages without server infrastructure may be
              unable to parse the feed.
            </>
          ),
        },
      ];
    return [];
  },
};
