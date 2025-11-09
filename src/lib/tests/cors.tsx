import type { Test, TestArgs } from "./_index";

export const testCORS: Test = {
  key: "permissive-cors",
  name: "Permissive CORS",
  test: async ({ required_server }: TestArgs) => {
    if (required_server)
      return [
        {
          status: "error",
          message: (
            <>
              Feed server is likely missing{" "}
              <code>Access-Control-Allow-Origin</code> HTTP response header with
              value of <code>*</code>. Some webpages may be unable to parse the
              feed.
            </>
          ),
        },
      ];
    return [];
  },
};
