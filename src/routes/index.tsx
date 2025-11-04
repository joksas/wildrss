import { KeyReturnIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Result, ResultAsync } from "neverthrow";
import { useEffect, useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
  Input,
  TextField,
} from "react-aria-components";
import { ProgressCircle } from "@/components/ProgressCircle";
import { XmlPathPreview } from "@/components/XMLPathPreview";
import {
  cancelFeedQueries,
  fetchFeed,
  parseFeed,
  prefetchFeed,
  type XML,
} from "@/lib/feed";
import { type Test, type TestResult, TestResultIcon } from "@/lib/tests/_index";
import { testCORS } from "@/lib/tests/cors";
import { testItunesImage } from "@/lib/tests/itunes_image";
import { testItunesOwner } from "@/lib/tests/itunes_owner";
import { testTitle } from "@/lib/tests/title";
import { testValue } from "@/lib/tests/value";

export const Route = createFileRoute("/")({ component: App });

const DEFAULT_URL = "https://www.feed.behindthesch3m3s.com/feed.xml";
const TESTS: Test[] = [
  testTitle,
  testValue,
  testItunesOwner,
  testItunesImage,
  testCORS,
];

type State = "pending" | "fetching" | "parsing" | "testing";

function App() {
  const client = useQueryClient();

  // State
  const [state, setState] = useState<State>("pending");
  const [url, setURL] = useState<string>(DEFAULT_URL);
  const [xml, setXML] = useState<XML | undefined>(undefined);
  const [results, setResults] = useState<TestResult[]>([]);
  const feedInfo = {
    title: xml?.rss?.at(0)?.channel?.at(0)?.title?.at(0)?.["@text"],
    image: xml?.rss?.at(0)?.channel?.at(0)?.["itunes:image"]?.at(0)?.[
      "@attributes"
    ][0].href,
  };

  useEffect(() => {
    cancelFeedQueries(client).then(() => prefetchFeed(client, url));
  }, [client, url]);

  const validate = async () => {
    try {
      if (state !== "pending") return;
      setResults([]);

      // Fetch
      setState("fetching");
      const fetchRes = await ResultAsync.fromPromise(
        fetchFeed(client, url),
        (e) => e,
      );
      if (fetchRes.isErr()) return setState("pending"); // TODO: set error

      // Parse
      setState("parsing");
      const { content, required_server } = fetchRes.value;
      const parseRes = Result.fromThrowable(parseFeed)(content);
      if (parseRes.isErr()) return setState("pending"); // TODO: set error
      const _xml = parseRes.value;
      setXML(_xml);

      // Run tests
      setState("testing");
      for (const test of TESTS) {
        setResults((prev) => [...prev, { name: test.name, status: "running" }]);

        const result = await test.test({ xml: _xml, required_server });
        setResults((prev) =>
          prev.map((_result) =>
            _result.name === test.name
              ? { ...result, name: test.name }
              : _result,
          ),
        );
      }

      setState("pending");
    } finally {
    }
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
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
              <KeyReturnIcon size={28} />
            )}
          {(state === "fetching" ||
            state === "parsing" ||
            state === "testing") && (
            <ProgressCircle isIndeterminate size={28} />
          )}
        </TextField>
      </div>
      <div className="paper mt-[120px] flex list-none flex-col gap-1 border-2 border-black bg-white/70 p-3 shadow-2xl">
        <h2 className="text-center font-bold font-display text-3xl">Report</h2>
        <h2>{feedInfo.title}</h2>
        <h2>{feedInfo.image}</h2>
        {TESTS.map((test) => {
          const result = results.find((result) => result.name === test.name);

          return (
            <Disclosure key={test.name}>
              <Heading className="flex items-center gap-1">
                <TestResultIcon
                  status={result?.status}
                  size={20}
                  weight="fill"
                  className="flex-none"
                />
                <span className="font-medium">{test.name}</span>
                {result?.status === "failed" && (
                  <Button
                    slot="trigger"
                    className="cursor-pointer text-inherit underline"
                  >
                    Show error
                  </Button>
                )}
              </Heading>
              <DisclosurePanel className="mt-2 ml-6 flex flex-col gap-1">
                {result?.status === "failed" && (
                  <>
                    <span className="text-red-700">{result.error}</span>
                    {xml && result.path && (
                      <XmlPathPreview xml={xml} path={result.path} />
                    )}
                  </>
                )}
              </DisclosurePanel>
            </Disclosure>
          );
        })}
      </div>
    </div>
  );
}
