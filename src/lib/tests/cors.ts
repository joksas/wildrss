import type { Test, TestArgs } from "./_index";

export const testCORS: Test = {
  key: "permissive-cors",
  name: "Permissive CORS",
  test: async ({ required_server }: TestArgs) => {
    if (required_server)
      return {
        status: "failed",
        error:
          "Feed server is likely missing 'Access-Control-Allow-Origin' HTTP response header with value of '*'. Some webpages may not be able to parse the feed.",
      };
    return { status: "passed" };
  },
};
