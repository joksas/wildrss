import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { XmlPathPreview } from "@/components/XMLPathPreview";
import { fetchFeed, parseFeed, type XML } from "@/lib/feed";
import { type Test, type TestResult, TestResultIcon } from "@/lib/tests/_index";
import { testItunesOwner } from "@/lib/tests/itunes_owner";
import { testTitle } from "@/lib/tests/title";
import { testValue } from "@/lib/tests/value";

export const Route = createFileRoute("/")({ component: App });

const URL = "https://www.feed.behindthesch3m3s.com/feed.xml";
const TESTS: Test[] = [testTitle, testValue, testItunesOwner];

function App() {
  const [xml, setXML] = useState<XML | undefined>();
  const [testResults, setTestResults] = useState<TestResult[]>(
    TESTS.map((_) => ({ status: "pending" })),
  );
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    try {
      setRunning(true);
      setTestResults(TESTS.map((_) => ({ status: "pending" })));

      const xml_string = await fetchFeed(URL);
      const _xml = parseFeed(xml_string);
      setXML(_xml);

      for (let i = 0; i < TESTS.length; i++) {
        setTestResults((prev) =>
          prev.map((p, _idx) => (_idx === i ? { status: "running" } : p)),
        );

        const result = await TESTS[i].test(_xml);

        setTestResults((prev) =>
          prev.map((p, _idx) => (_idx === i ? result : p)),
        );
      }
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 px-3 py-5">
      <h1 className="font-bold text-2xl">Homepage</h1>
      <button
        className="w-fit cursor-pointer border border-sky-950 bg-sky-100 px-3 py-2 font-bold text-sky-950 disabled:cursor-not-allowed disabled:opacity-50"
        type="button"
        onClick={runTests}
        disabled={running}
      >
        {running ? "Running tests..." : "Validate feed"}
      </button>
      <ul className="flex list-none flex-col gap-1">
        {TESTS.map((test, index) => {
          const result = testResults[index];

          return (
            <li key={test.name} className="flex items-center gap-1">
              <TestResultIcon
                status={result.status}
                size={20}
                weight="fill"
                className="flex-none"
              />
              <span className="font-medium">
                {test.name}
                {result.status === "failed" && (
                  <>
                    <span className="text-red-600 text-sm">
                      {" "}
                      {result.error}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {" "}
                      ({result.path.join(" → ")})
                    </span>
                    {xml && <XmlPathPreview xml={xml} path={result.path} />}
                  </>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
