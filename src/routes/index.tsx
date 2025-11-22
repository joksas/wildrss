import {
  createCollection,
  eq,
  localStorageCollectionOptions,
  useLiveQuery,
} from "@tanstack/react-db";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Result, ResultAsync } from "neverthrow";
import { useQueryState } from "nuqs";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFilter } from "react-aria";
import {
  ComboBox,
  Input,
  ListBox,
  ListBoxItem,
  Popover,
} from "react-aria-components";
import * as z from "zod";
import { ProgressCircle } from "@/components/ProgressCircle";
import { TestGroupDisplay } from "@/components/TestGroupDisplay";
import {
  cancelFeedQueries,
  fetchFeed,
  parseFeed,
  prefetchFeed,
  type XML,
} from "@/lib/feed";
import {
  TEST_GROUPS,
  type Test,
  type TestOutput,
  type ValidationState,
} from "@/lib/tests/_index";
import testCORS from "@/lib/tests/cors";
import testDescription from "@/lib/tests/description";
import testFetching from "@/lib/tests/fetching";
import testItunesImage from "@/lib/tests/itunes_image";
import testItunesOwner from "@/lib/tests/itunes_owner";
import testLink from "@/lib/tests/link";
import testPodcastGuid from "@/lib/tests/podcast_guid";
import testPodcastValue from "@/lib/tests/podcast_value";
import testRSSEnclosure from "@/lib/tests/rss_enclosure";
import testRSSGUID from "@/lib/tests/rss_guid";
import testTitle from "@/lib/tests/title";
import { isWebURL, WebURL } from "@/lib/url";

const feedInfos = createCollection(
  localStorageCollectionOptions({
    id: "feed-infos",
    storageKey: "feed-infos",
    getKey: (item) => item.url,
    schema: z.object({
      url: WebURL,
      title: z.string().trim().nonempty().optional().catch(undefined),
      author: z.string().trim().nonempty().optional().catch(undefined),
      image: WebURL.optional().catch(undefined),
      updated: z.date(),
    }),
  }),
);

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
  component: App,
});

const TESTS: Test[] = [
  testFetching,
  testCORS,
  testTitle,
  testDescription,
  testRSSEnclosure,
  testRSSGUID,
  testLink,
  testPodcastGuid,
  testPodcastValue,
  testItunesOwner,
  testItunesImage,
];

function App() {
  const client = useQueryClient();

  // State
  const [state, setState] = useState<ValidationState>("pending");
  const [url, setURL] = useQueryState("url", {
    defaultValue: "",
    parse: (raw: string | null) => (raw ? decodeURIComponent(raw) : ""),
    serialize: (value: string) => encodeURIComponent(value),
  });
  const isProperURL = isWebURL(url);
  const [xml, setXML] = useState<XML | undefined>(undefined);
  const [results, setResults] = useState<Record<string, TestOutput[]>>({});
  const { data: feedInfo } = useLiveQuery(
    (q) =>
      q
        .from({ feedInfos })
        .where(({ feedInfos }) => eq(feedInfos.url, url))
        .findOne(),
    [url],
  );
  const canValidate = isProperURL && state === "pending";
  const hasResults = Object.entries(results).length > 0;

  useEffect(() => {
    if (!isProperURL) return;
    cancelFeedQueries(client).then(() => prefetchFeed(client, url));
  }, [client, url, isProperURL]);
  useEffect(() => setResults({}), [url]);

  const validate = async () => {
    try {
      setManuallyValidate(false);
      if (!canValidate) return;
      setResults({});
      setXML(undefined);

      // Fetch
      setState("fetching");
      await new Promise((resolve) => setTimeout(resolve, 1));
      const fetchRes = await ResultAsync.fromPromise(
        fetchFeed(client, url),
        (e) => e,
      );
      if (fetchRes.isErr()) {
        setResults({
          [testFetching.key]: [
            { status: "error", message: "Failed to download" },
          ],
        });
        setState("pending");
        return;
      }

      // Parse
      setState("parsing");
      const { content, time_ms: fetching_time_ms, headers } = fetchRes.value;
      const parseRes = Result.fromThrowable(parseFeed)(content);
      if (parseRes.isErr()) {
        setResults({
          [testFetching.key]: [
            {
              status: "error",
              message: "This does not look like an RSS feed",
            },
          ],
        });
        setState("pending");
        return;
      }
      const _xml = parseRes.value;
      setXML(_xml);
      if (feedInfo) {
        feedInfos.update(feedInfo.url, (feedInfo) => {
          feedInfo.title = _xml.rss?.at(0)?.channel?.at(0)?.title?.at(0)?.[
            "@text"
          ];
          feedInfo.author = _xml.rss
            ?.at(0)
            ?.channel?.at(0)
            ?.["itunes:author"]?.at(0)?.["@text"];
          feedInfo.image = _xml.rss
            ?.at(0)
            ?.channel?.at(0)
            ?.["itunes:image"]?.at(0)?.["@attributes"][0].href;
          feedInfo.updated = new Date();
        });
      } else {
        Result.fromThrowable(feedInfos.insert)({
          url,
          title: _xml.rss?.at(0)?.channel?.at(0)?.title?.at(0)?.["@text"],
          author: _xml.rss?.at(0)?.channel?.at(0)?.["itunes:author"]?.at(0)?.[
            "@text"
          ],
          image: _xml.rss?.at(0)?.channel?.at(0)?.["itunes:image"]?.at(0)?.[
            "@attributes"
          ][0].href,
          updated: new Date(),
        });
      }

      // Run tests
      setState("testing");
      const allResults: Record<string, TestOutput[]> = {};

      for (const test of TESTS) {
        const result = await test.test({
          xml: _xml,
          fetching_info: {
            success: true,
            time_ms: fetching_time_ms,
            headers,
          },
        });
        allResults[test.key] = result;
      }

      setResults(allResults);
      setState("pending");
    } finally {
    }
  };

  // Validate on load
  useEffect(() => {
    if (!isProperURL) return;
    console.log("validate on load");
    validate();
  }, []);

  // Manually validate
  const [manuallyValidate, setManuallyValidate] = useState(false);
  useEffect(() => {
    if (manuallyValidate) validate();
  }, [manuallyValidate]);

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-3 py-3">
      <div className="flex h-[125px] w-full flex-col items-center justify-center gap-3">
        <h1 className="text-center font-bold font-display text-5xl">
          Wild Wild RSS
        </h1>
        <FeedSearchInput
          url={url}
          setURL={setURL}
          error={url.trim().length > 0 && !isProperURL ? "Bad URL" : undefined}
          loading={
            state === "fetching" || state === "parsing" || state === "testing"
          }
          onSubmit={async () => setManuallyValidate(true)}
        />
      </div>
      <section className="mt-[120px] w-full max-w-5xl grow border-8 border-amber-950 bg-amber-50 text-amber-950">
        <header className="border-amber-950 border-b-8 bg-amber-950 px-5 py-2 text-center font-bold font-display text-3xl text-amber-50">
          Report
        </header>
        <div className="flex flex-col gap-5 p-5">
          <AnimatePresence mode="popLayout">
            {hasResults && feedInfo?.title && feedInfo.image && (
              <motion.div
                key={feedInfo.title}
                className="flex items-center gap-4 overflow-hidden border-4 border-amber-950 bg-amber-100 p-3"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <img
                  src={feedInfo.image}
                  alt="Podcast artwork"
                  className="size-20 object-cover object-center sepia-[0.7]"
                  loading="lazy"
                />
                <div className="flex flex-col font-display">
                  <span className="font-bold text-2xl">{feedInfo.title}</span>
                  {feedInfo.author && (
                    <span className="text-lg">{feedInfo.author}</span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-6">
            {TEST_GROUPS.map((group) => (
              <TestGroupDisplay
                key={group}
                results={results}
                tests={TESTS}
                group={group}
                xml={xml}
                state={state}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function FeedSearchInput({
  url,
  setURL,
  error,
  loading,
  onSubmit,
}: {
  url: string;
  setURL: Dispatch<SetStateAction<string>>;
  error?: string;
  loading?: boolean;
  onSubmit: () => Promise<void>;
}) {
  const { data: allFeedInfos } = useLiveQuery(
    (q) =>
      q
        .from({ feedInfos })
        .select(({ feedInfos }) => ({ ...feedInfos }))
        .orderBy(({ feedInfos }) => feedInfos.updated, "desc"),
    [],
  );
  const { contains } = useFilter({ sensitivity: "base" });
  const filteredFeedInfos = useMemo(
    () =>
      allFeedInfos
        .filter(
          (item) =>
            contains(item.url, url) ||
            (!!item.title && contains(item.title, url)),
        )
        .map((item) => ({ id: item.url, ...item })),
    [allFeedInfos, url, contains],
  );
  const trigger = useRef(null);
  console.log({ filteredFeedInfos });

  return (
    <ComboBox
      allowsCustomValue
      menuTrigger="focus"
      inputValue={url}
      onInputChange={setURL}
      items={filteredFeedInfos}
    >
      <div
        ref={trigger}
        className="flex w-full items-center gap-2 border-2 border-black bg-white/60 px-3 py-2 text-xl sm:w-[400px] md:w-[500px] lg:w-[600px]"
      >
        <Input
          type="url"
          placeholder="Enter feed URL"
          className="grow truncate focus:outline-none"
          autoFocus
          required
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            (window.document.activeElement as HTMLInputElement).blur();
            onSubmit();
          }}
        />
        {error && (
          <div className="flex items-center gap-2 font-medium text-red-700">
            {error}
          </div>
        )}
        {loading && (
          <div className="flex size-7 items-center justify-center">
            <ProgressCircle size={24} />
          </div>
        )}
      </div>
      <Popover
        placement="bottom"
        triggerRef={trigger}
        className="flex w-full flex-col items-center gap-2 border-2 border-black text-xl sm:w-[400px] md:w-[500px] lg:w-[600px]"
        isKeyboardDismissDisabled={true}
      >
        <div className="w-full">
          <div className="flex w-full grow items-center gap-1 bg-white/60 px-3">
            <div className="h-[1.5px] w-8 flex-none bg-amber-950" />
            <span className="flex-none text-sm">Recent validations</span>
            <div className="h-[1.5px] grow bg-amber-950" />
          </div>
          <ListBox items={filteredFeedInfos} className="w-full">
            {(info) => (
              <ListBoxItem
                id={info.url}
                key={info.url}
                onAction={() => {
                  setURL(info.url);
                  (window.document.activeElement as HTMLInputElement).blur();
                  onSubmit();
                }}
                className="flex w-full grow items-center gap-2 bg-white/60 px-3 py-2 focus:bg-white/90"
              >
                <img
                  src={info.image}
                  alt="Podcast artwork"
                  className="size-7 object-cover object-center sepia-[0.7]"
                  loading="lazy"
                />

                {info.title}
              </ListBoxItem>
            )}
          </ListBox>
        </div>
      </Popover>
    </ComboBox>
  );
}
