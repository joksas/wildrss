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

type State = (
  | {
      state: "pending";
    }
  | {
      state: "fetching";
    }
  | {
      state: "parsing";
    }
  | {
      state: "error";
      error: string;
    }
  | {
      state: "running";
      xml: XML;
      results: TestResult[];
    }
  | {
      state: "finished";
      xml: XML;
      results: TestResult[];
    }
) & { url: string };

function App() {
  const [state, setState] = useState<State>({
    state: "pending",
    url: DEFAULT_URL,
  });
  const setURL = (url: string) => setState((prev) => ({ ...prev, url }));
  const client = useQueryClient();

  useEffect(() => {
    cancelFeedQueries(client).then(() => prefetchFeed(client, state.url));
  }, [client, state.url]);

  const validate = async () => {
    try {
      if (state.state !== "pending" && state.state !== "finished") return;

      // Fetch
      setState(({ url }) => ({ state: "fetching", url }));
      const fetchRes = await ResultAsync.fromPromise(
        fetchFeed(client, state.url),
        (e) => e,
      );
      if (fetchRes.isErr())
        return setState(({ url }) => ({
          state: "error",
          error: "Failed to fetch",
          url,
        }));

      // Parse
      setState(({ url }) => ({ state: "parsing", url }));
      const { content, required_server } = fetchRes.value;
      const parseRes = Result.fromThrowable(parseFeed)(content);
      if (parseRes.isErr())
        return setState(({ url }) => ({
          state: "error",
          error: "Failed to parse",
          url,
        }));
      const xml = parseRes.value;

      // Run tests
      setState(({ url }) => ({
        state: "running",
        xml,
        results: TESTS.map((_) => ({ status: "pending" })),
        url,
      }));

      for (let i = 0; i < TESTS.length; i++) {
        setState((prev) =>
          prev.state === "running"
            ? {
                ...prev,
                results: prev.results.map((p, _idx) =>
                  _idx === i ? { status: "running" } : p,
                ),
              }
            : prev,
        );

        const result = await TESTS[i].test({ xml: xml, required_server });
        setState((prev) =>
          prev.state === "running"
            ? {
                ...prev,
                results: prev.results.map((p, _idx) =>
                  _idx === i ? result : p,
                ),
              }
            : prev,
        );
      }

      setState((prev) =>
        prev.state === "running"
          ? {
              ...prev,
              state: "finished",
            }
          : prev,
      );
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
          value={state.url}
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
          {(state.state === "pending" ||
            state.state === "finished" ||
            state.state === "error") &&
            (state.url.startsWith("http://") ||
              state.url.startsWith("https://")) && <KeyReturnIcon size={28} />}
          {(state.state === "fetching" ||
            state.state === "parsing" ||
            state.state === "running") && (
            <ProgressCircle isIndeterminate size={28} />
          )}
        </TextField>
      </div>
      {(state.state === "running" || state.state === "finished") && (
        <div className="paper mt-[120px] flex list-none flex-col gap-1 border-2 border-black bg-white/70 p-3 shadow-2xl">
          <h2 className="text-center font-bold font-display text-3xl">
            Report
          </h2>
          {TESTS.map((test, index) => {
            const result = state.results[index];

            return (
              <Disclosure key={test.name}>
                <Heading className="flex items-center gap-1">
                  <TestResultIcon
                    status={result.status}
                    size={20}
                    weight="fill"
                    className="flex-none"
                  />
                  <span className="font-medium">{test.name}</span>
                  {result.status === "failed" && (
                    <Button
                      slot="trigger"
                      className="cursor-pointer text-inherit underline"
                    >
                      Show error
                    </Button>
                  )}
                </Heading>
                <DisclosurePanel className="mt-2 ml-6 flex flex-col gap-1">
                  {result.status === "failed" && (
                    <>
                      <span className="text-red-700">{result.error}</span>
                      {state.xml && result.path && (
                        <XmlPathPreview xml={state.xml} path={result.path} />
                      )}
                    </>
                  )}
                </DisclosurePanel>
              </Disclosure>
            );
          })}
        </div>
      )}
    </div>
  );
}
