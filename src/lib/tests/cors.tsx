import type { Test, TestArgs } from "./_index";

export const testCORS: Test = {
  key: "permissive-cors",
  group: "basic",
  name: "Permissive CORS",
  test: async ({ fetching_info: { headers } }: TestArgs) => {
    const typed_headers = new Headers(headers);
    const allow_origin_header = typed_headers.get(
      "access-control-allow-origin",
    );
    if (allow_origin_header === null)
      return [
        {
          status: "error",
          message: (
            <>
              Feed HTTP response is missing{" "}
              <code>Access-Control-Allow-Origin</code> header. Webpages without
              server infrastructure may be unable to parse the feed.
            </>
          ),
        },
      ];
    if (allow_origin_header !== "*")
      return [
        {
          status: "error",
          message: (
            <>
              Feed HTTP response <code>Access-Control-Allow-Origin</code> header
              has a value of <code>{allow_origin_header}</code>. Unless it is
              set to <code>*</code>, webpages without server infrastructure may
              be unable to parse the feed.
            </>
          ),
        },
      ];

    return [];
  },
};
