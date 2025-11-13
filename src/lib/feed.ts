import { isServer, type QueryClient } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { XMLParser } from "fast-xml-parser";
import * as z from "zod";

/** XML */
type _XML<K extends readonly string[], L extends readonly string[]> = {
  [P in K[number]]: string | undefined;
} & {
  [P in L[number]]: [Record<string, string>];
} & {
  [P in Exclude<Exclude<string, K[number]>, L[number]>]:
    | _XML<K, L>[]
    | undefined;
};
export type XML = _XML<["@text"], ["@attributes"]>;

async function _fetchQueryFunction(url: string, signal: AbortSignal) {
  try {
    const t1 = performance.now();
    const { content } = await _fetchFeed({ data: url, signal });
    const t2 = performance.now();
    const time_ms = Math.ceil(t2 - t1);
    return { content, time_ms };
  } catch (error) {
    if (isServer) throw error;
    console.error(error);
    console.info(`Retrying fetch for ${url} via server`);
    const t1 = performance.now();
    const { content, info: server_info } = await _fetchFeedServer({
      data: url,
      signal,
    });
    const t2 = performance.now();
    const time_ms = Math.ceil(t2 - t1);
    console.info(`Successfully fetched ${url} via server`);
    return { content, time_ms, server_info };
  }
}

/** Fetch RSS feed */
export function fetchFeed(
  client: QueryClient,
  url: string,
): Promise<{
  content: string;
  time_ms: number;
  server_info?: { headers: Record<string, string> };
}> {
  return client.fetchQuery({
    staleTime: 10_000,
    queryKey: ["feed", url],
    queryFn: ({ signal }) => _fetchQueryFunction(url, signal),
    retry: 3,
  });
}

/** Prefetch RSS feed */
export async function prefetchFeed(
  client: QueryClient,
  url: string,
): Promise<void> {
  return await client.prefetchQuery({
    staleTime: 10_000,
    queryKey: ["feed", url],
    queryFn: ({ signal }) => _fetchQueryFunction(url, signal),
    retry: 3,
  });
}

/** Cancel feed queries */
export async function cancelFeedQueries(client: QueryClient): Promise<void> {
  return await client.cancelQueries({
    queryKey: ["feed"],
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

async function _fetchFeed({
  data: url,
  signal,
}: {
  data: string;
  signal: AbortSignal;
}): Promise<{ content: string; info: { headers: Record<string, string> } }> {
  const res = await fetch(url, { signal });
  if (res.status !== 200) throw Error(`Status ${res.status}`);
  const content = await res.text();
  const headers: Record<string, string> = {};
  for (const [key, val] of res.headers.entries()) {
    headers[key] = val;
  }
  return { content, info: { headers } };
}
const _fetchFeedServer = createServerFn()
  .inputValidator(z.string())
  .handler(async ({ data, signal }) => {
    "use server";
    return _fetchFeed({ data, signal });
  });
