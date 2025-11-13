import { KeyReturnIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Result, ResultAsync } from "neverthrow";
import { useEffect, useState } from "react";
import { Button, Input, TextField } from "react-aria-components";
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
import { testCORS } from "@/lib/tests/cors";
import testDescription from "@/lib/tests/description";
import testItunesImage from "@/lib/tests/itunes_image";
import { testItunesOwner } from "@/lib/tests/itunes_owner";
import { testTitle } from "@/lib/tests/title";
import { testValue } from "@/lib/tests/value";

export const Route = createFileRoute("/")({ component: App });

const DEFAULT_URL = "https://www.feed.behindthesch3m3s.com/feed.xml";
const TESTS: Test[] = [
  testTitle,
  testDescription,
  testValue,
  testItunesOwner,
  testItunesImage,
  testCORS,
];

function App() {
  const client = useQueryClient();

  // State
  const [state, setState] = useState<ValidationState>("pending");
  const [url, setURL] = useState<string>(DEFAULT_URL);
  const isProperURL = z.url().safeParse(url).success;
  const [xml, setXML] = useState<XML | undefined>(undefined);
  const [results, setResults] = useState<Record<string, TestOutput[]>>({});
  const feedInfo = {
    title: xml?.rss?.at(0)?.channel?.at(0)?.title?.at(0)?.["@text"],
    author: xml?.rss?.at(0)?.channel?.at(0)?.["itunes:author"]?.at(0)?.[
      "@text"
    ],
    image: xml?.rss?.at(0)?.channel?.at(0)?.["itunes:image"]?.at(0)?.[
      "@attributes"
    ][0].href,
  };

  useEffect(() => {
    if (!isProperURL) return;
    cancelFeedQueries(client).then(() => prefetchFeed(client, url));
  }, [client, url, isProperURL]);

  const validate = async () => {
    try {
      if (state !== "pending") return;
      setResults({});
      setXML(undefined);

      // Fetch
      setState("fetching");
      await new Promise((resolve) => setTimeout(resolve, 1)); // Artificial delay
      const fetchRes = await ResultAsync.fromPromise(
        fetchFeed(client, url),
        (e) => e,
      );
      if (fetchRes.isErr()) return setState("pending"); // TODO: set error

      // Parse
      setState("parsing");
      const { content, server_info } = fetchRes.value;
      const parseRes = Result.fromThrowable(parseFeed)(content);
      if (parseRes.isErr()) return setState("pending"); // TODO: set error
      const _xml = parseRes.value;
      setXML(_xml);

      // Run tests
      setState("testing");
      for (const test of TESTS) {
        const result = await test.test({ xml: _xml, server_info });
        setResults((prev) => ({ ...prev, [test.key]: result }));
      }

      setState("pending");
    } finally {
    }
  };
  // Validate on load
  useEffect(() => {
    if (!isProperURL) return;
    validate();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-2 px-3 py-3">
      <div className="flex h-[125px] w-full flex-col items-center justify-center gap-3">
        <h1 className="text-center font-bold font-display text-5xl">
          Wild Wild RSS
        </h1>
        <TextField
          value={url}
          onChange={setURL}
          className="flex w-[300px] items-center border-2 border-black bg-white/60 px-3 py-2 font-serif text-xl sm:w-[400px] md:w-[500px] lg:w-[600px]"
          aria-label="Feed URL"
        >
          <Input
            placeholder="Enter feed URL"
            className="grow truncate font-serif focus:outline-none"
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              (window.document.activeElement as HTMLInputElement).blur();
              validate();
            }}
          />
          {state === "pending" &&
            (url.startsWith("http://") || url.startsWith("https://")) && (
              <Button onPress={validate} className="cursor-pointer">
                <KeyReturnIcon size={28} />
              </Button>
            )}
          {(state === "fetching" ||
            state === "parsing" ||
            state === "testing") && (
            <ProgressCircle isIndeterminate size={28} />
          )}
        </TextField>
      </div>
      <section className="mt-[120px] w-full max-w-5xl grow border-8 border-amber-950 bg-amber-50 text-amber-950">
        <header className="border-amber-950 border-b-8 bg-amber-950 px-5 py-2 text-center font-bold font-display text-3xl text-amber-50">
          Report
        </header>
        <div className="flex flex-col gap-5 p-5">
          <AnimatePresence mode="popLayout">
            {feedInfo.author && feedInfo.image && (
              <motion.div
                key={feedInfo.title}
                className="flex items-center gap-4 overflow-hidden border-4 border-amber-950 bg-amber-100 p-3"
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
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
