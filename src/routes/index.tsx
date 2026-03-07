import { createFileRoute } from "@tanstack/react-router";
import { ResultAsync } from "neverthrow";
import * as z from "zod";
import { HomePage } from "@/components/HomePage";
import { fetchFeed, prefetchFeed } from "@/lib/feed";
import { extractTitle } from "@/lib/string";
import { WebURL } from "@/lib/url";

// Constants
export const WEBSITE_URL = "https://wildrss.com";
export const WEBSITE_NAME = "Wild RSS";
export const WEBSITE_DESCRIPTION =
  "RSS validator for truly wild feeds. Support for Apple Podcasts (iTunes) and Podcasting 2.0 namespaces.";
export const WEBSITE_IMAGE = "og.png";

// Route
export const Route = createFileRoute("/")({
  validateSearch: z.object({
    url: z
      .string()
      .optional()
      .transform((url) => (url ? decodeURIComponent(url) : url))
      .pipe(WebURL.optional())
      .catch(undefined),
  }),
  loaderDeps: ({ search: { url } }) => ({ url }),
  loader: async ({ context: { queryClient }, deps: { url } }) => {
    if (url) prefetchFeed(queryClient, url);
  },
  head: async (ctx) => {
    // Get URL in search params
    const url = ctx.match.search.url;

    // If no URL, use default metadata
    if (!url) return {};

    // Extract title, use default metadata if failed
    const { content } = await ResultAsync.fromThrowable(fetchFeed)(
      ctx.match.context.queryClient,
      url,
    ).unwrapOr({ content: undefined });
    if (!content) return {};
    const title = extractTitle(content);
    if (!title) return {};
    const urlEncoded = encodeURIComponent(url);

    // Construct OG
    const ogTitle = `${title} - ${WEBSITE_NAME}`;
    const ogURL = `${WEBSITE_URL}?url=${urlEncoded}`;
    return {
      meta: [
        { name: "og:title", content: ogTitle },
        { name: "twitter:title", content: ogTitle },
        { name: "og:url", content: ogURL },
        { name: "twitter:url", content: ogURL },
      ],
    };
  },
  component: HomePage,
});
