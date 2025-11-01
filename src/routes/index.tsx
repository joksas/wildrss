import { KeyReturnIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Button,
  Disclosure,
  DisclosurePanel,
  Heading,
  Input,
  TextField,
} from "react-aria-components";
import { XmlPathPreview } from "@/components/XMLPathPreview";
import { fetchFeed, parseFeed, type XML } from "@/lib/feed";
import { type Test, type TestResult, TestResultIcon } from "@/lib/tests/_index";
import { testCORS } from "@/lib/tests/cors";
import { testItunesOwner } from "@/lib/tests/itunes_owner";
import { testTitle } from "@/lib/tests/title";
import { testValue } from "@/lib/tests/value";

export const Route = createFileRoute("/")({ component: App });

const DEFAULT_URL = "https://www.feed.behindthesch3m3s.com/feed.xml";
const TESTS: Test[] = [testTitle, testValue, testItunesOwner, testCORS];

function App() {
  const [url, setURL] = useState(DEFAULT_URL);
  const [xml, setXML] = useState<XML | undefined>();
  const [testResults, setTestResults] = useState<TestResult[]>(
    TESTS.map((_) => ({ status: "pending" })),
  );
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    try {
      setRunning(true);
      setTestResults(TESTS.map((_) => ({ status: "pending" })));

      const { content, required_server } = await fetchFeed(url);
      const _xml = parseFeed(content);
      setXML(_xml);

      for (let i = 0; i < TESTS.length; i++) {
        setTestResults((prev) =>
          prev.map((p, _idx) => (_idx === i ? { status: "running" } : p)),
        );

        const result = await TESTS[i].test({ xml: _xml, required_server });

        setTestResults((prev) =>
          prev.map((p, _idx) => (_idx === i ? result : p)),
        );
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-3">
      <h1 className="text-center font-bold text-5xl">Wild Wild RSS</h1>
      <TextField
        value={url}
        onChange={setURL}
        className="mx-auto flex w-[300px] items-center border border-black bg-white/75 px-3 py-2 font-serif text-xl sm:w-[400px] md:w-[500px] lg:w-[600px]"
        aria-label="Feed URL"
      >
        <Input
          placeholder="Enter feed URL"
          className="grow truncate focus:outline-none"
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            (window.document.activeElement as HTMLInputElement).blur();
            runTests();
          }}
        />
        {(url.startsWith("http://") || url.startsWith("https://")) && (
          <KeyReturnIcon size={28} />
        )}
      </TextField>
      <div className="flex list-none flex-col gap-1">
        {TESTS.map((test, index) => {
          const result = testResults[index];

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
              <DisclosurePanel>
                {result.status === "failed" && (
                  <>
                    {result.error}
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
