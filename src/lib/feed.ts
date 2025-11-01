import { isServer } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { XMLParser } from "fast-xml-parser";
import * as z from "zod";
import { getContext } from "@/providers";

/** XML */
type _XML<K extends readonly string[], L extends readonly string[]> = {
  [P in K[number]]: string | undefined;
} & {
  [P in L[number]]: [Record<string, string>];
} & {
  [P in Exclude<Exclude<string, K[number]>, L[number]>]: _XML<K, L>[];
};
export type XML = _XML<["@text"], ["@attributes"]>;

/** Fetch RSS feed */
export function fetchFeed(
  url: string,
): Promise<{ content: string; required_server: boolean }> {
  const { queryClient } = getContext();
  return queryClient.fetchQuery({
    queryKey: ["feed", url],
    queryFn: async (): Promise<{
      content: string;
      required_server: boolean;
    }> => {
      try {
        const content = await _fetchFeed({ data: url });
        return { content, required_server: false };
      } catch (error) {
        if (isServer) throw error;
        console.error(error);
        console.info(`Retrying fetch for ${url} via server`);
        const content = await _fetchFeedServer({ data: url });
        console.info(`Successfully fetched ${url} via server`);
        return { content, required_server: true };
      }
    },
    retry: 3,
  });
}

/** Parse RSS feed */
export function parseFeed(xml_string: string): XML {
  "use client";
  const parser = new XMLParser({
    ignoreAttributes: false,
    alwaysCreateTextNode: true,
    attributesGroupName: "@attributes",
    textNodeName: "@text",
    attributeNamePrefix: "",
    isArray: () => true,
  });
  const xml = parser.parse(xml_string) as XML;
  return xml;
}

async function _fetchFeed({ data: url }: { data: string }): Promise<string> {
  const res = await fetch(url);
  if (res.status !== 200) throw Error(`Status ${res.status}`);
  const body = await res.text();
  return body;
}
const _fetchFeedServer = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data }) => {
    "use server";
    return _fetchFeed({ data });
  });
